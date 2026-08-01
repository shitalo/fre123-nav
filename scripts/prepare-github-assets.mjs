import { promises as fs } from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = process.cwd()
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config')
const PUBLIC_GITHUB_ASSET_DIR = path.join(PROJECT_ROOT, 'public', 'github-assets')
const GENERATED_FAILURE_FILE = path.join(PROJECT_ROOT, 'config', 'github-asset-local-failures.generated.ts')
const DOWNLOAD_CONCURRENCY = 8

const IMAGE_EXTENSION_SET = new Set([
	'.apng',
	'.avif',
	'.gif',
	'.ico',
	'.jpeg',
	'.jpg',
	'.png',
	'.svg',
	'.webp',
	'.x-icon',
	'.vnd.microsoft.icon',
])

const CONTENT_TYPE_EXTENSION_MAP = new Map([
	['image/apng', '.apng'],
	['image/avif', '.avif'],
	['image/gif', '.gif'],
	['image/jpeg', '.jpg'],
	['image/jpg', '.jpg'],
	['image/png', '.png'],
	['image/svg+xml', '.svg'],
	['image/webp', '.webp'],
	['image/x-icon', '.ico'],
	['image/vnd.microsoft.icon', '.ico'],
])

const IMAGE_EXTENSION_SUFFIX_LIST = Array.from(IMAGE_EXTENSION_SET).sort((left, right) => {
	return right.length - left.length
})

const normalizeImageExtension = (extension) => {
	const normalizedExtension = extension.toLowerCase()

	if (normalizedExtension === '.jpeg') {
		return '.jpg'
	}

	if (normalizedExtension === '.x-icon' || normalizedExtension === '.vnd.microsoft.icon') {
		return '.ico'
	}

	return normalizedExtension
}

const getExtensionFromUrl = (urlString) => {
	try {
		const url = new URL(urlString)
		const normalizedPathname = url.pathname.toLowerCase()

		for (const extensionSuffix of IMAGE_EXTENSION_SUFFIX_LIST) {
			if (normalizedPathname.endsWith(extensionSuffix)) {
				return normalizeImageExtension(extensionSuffix)
			}
		}

		const extension = path.posix.extname(url.pathname)
		return extension ? normalizeImageExtension(extension) : null
	} catch {
		return null
	}
}

const getExtensionFromContentType = (contentType) => {
	if (!contentType) {
		return null
	}

	const normalizedContentType = contentType.split(';')[0].trim().toLowerCase()
	return CONTENT_TYPE_EXTENSION_MAP.get(normalizedContentType) ?? null
}

const isLikelyImageAsset = (urlString) => {
	const extension = getExtensionFromUrl(urlString)
	return extension ? IMAGE_EXTENSION_SET.has(extension) : false
}

const extractNestedGithubUrl = (input) => {
	const match = input.match(/https?:\/\/[^/]+\/(https?:\/\/.+)$/i)
	return match?.[1] ?? null
}

const parseGithubAssetUrl = (input) => {
	if (!input) {
		return null
	}

	const nestedGithubUrl = extractNestedGithubUrl(input)
	if (nestedGithubUrl) {
		return parseGithubAssetUrl(nestedGithubUrl)
	}

	try {
		const url = new URL(input)
		const { hostname, pathname } = url

		if (hostname.endsWith('.jsdelivr.net') && pathname.startsWith('/gh/')) {
			const segments = pathname.split('/').filter(Boolean)
			if (segments.length < 4) {
				return null
			}

			const owner = segments[1]
			const repoWithRef = segments[2]
			const restPath = segments.slice(3)
			const [repo, ref = 'master'] = repoWithRef.split('@')
			if (!owner || !repo || restPath.length === 0) {
				return null
			}

			return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${restPath.join('/')}`
		}

		if (hostname === 'raw.githubusercontent.com') {
			const segments = pathname.split('/').filter(Boolean)
			if (segments.length < 4) {
				return null
			}

			const [owner, repo, ref, ...restPath] = segments
			if (!owner || !repo || !ref || restPath.length === 0) {
				return null
			}

			return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${restPath.join('/')}`
		}

		if (hostname === 'github.com') {
			const segments = pathname.split('/').filter(Boolean)

			if (segments.length >= 5 && segments[2] === 'releases' && segments[3] === 'download') {
				return url.toString()
			}

			if (segments.length >= 5) {
				const [owner, repo, action, ref, ...restPath] = segments
				if ((action === 'blob' || action === 'raw') && owner && repo && ref && restPath.length > 0) {
					return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${restPath.join('/')}`
				}
			}
		}
	} catch {
		return null
	}

	return null
}

const collectStringValues = (input, result = []) => {
	if (typeof input === 'string') {
		result.push(input)
		return result
	}

	if (Array.isArray(input)) {
		for (const item of input) {
			collectStringValues(item, result)
		}
		return result
	}

	if (input && typeof input === 'object') {
		for (const value of Object.values(input)) {
			collectStringValues(value, result)
		}
	}

	return result
}

const getConfigJsonFiles = async (directoryPath) => {
	const entries = await fs.readdir(directoryPath, { withFileTypes: true })
	const fileList = []

	for (const entry of entries) {
		const fullPath = path.join(directoryPath, entry.name)
		if (entry.isDirectory()) {
			fileList.push(...(await getConfigJsonFiles(fullPath)))
			continue
		}

		if (entry.isFile() && entry.name.endsWith('.json')) {
			fileList.push(fullPath)
		}
	}

	return fileList
}

const toDisplayPath = (inputPath) => {
	return path.relative(PROJECT_ROOT, inputPath) || '.'
}

const collectGithubImageUrlsFromConfig = async () => {
	const configFileList = await getConfigJsonFiles(CONFIG_DIR)
	const githubImageUrlSet = new Set()
	const fileSummaries = []

	for (const configFilePath of configFileList.sort()) {
		const fileContent = await fs.readFile(configFilePath, 'utf8')
		const jsonContent = JSON.parse(fileContent)
		const stringValues = collectStringValues(jsonContent)
		const fileGithubImageUrlSet = new Set()

		for (const value of stringValues) {
			const normalizedGithubUrl = parseGithubAssetUrl(value)
			if (!normalizedGithubUrl || !isLikelyImageAsset(normalizedGithubUrl)) {
				continue
			}

			githubImageUrlSet.add(normalizedGithubUrl)
			fileGithubImageUrlSet.add(normalizedGithubUrl)
		}

		fileSummaries.push({
			filePath: configFilePath,
			stringValueCount: stringValues.length,
			githubImageUrlCount: fileGithubImageUrlSet.size,
			sampleUrlList: Array.from(fileGithubImageUrlSet).slice(0, 3),
		})
	}

	return {
		configFileList: configFileList.sort(),
		fileSummaries,
		githubImageUrlList: Array.from(githubImageUrlSet).sort((left, right) => left.localeCompare(right)),
	}
}

const resolveOutputExtension = (urlString, contentType) => {
	return getExtensionFromContentType(contentType) ?? getExtensionFromUrl(urlString) ?? '.png'
}

const buildLocalGithubAssetPath = (urlString, contentType) => {
	try {
		const url = new URL(urlString)
		const pathSegmentList = url.pathname.split('/').filter(Boolean)
		const originalFileName = pathSegmentList.pop()

		if (!url.hostname || !originalFileName) {
			return null
		}

		const parsedFileName = path.posix.parse(originalFileName)
		const outputExtension = resolveOutputExtension(urlString, contentType)
		const normalizedFileName = `${parsedFileName.name}${outputExtension}`
		const relativePath = path.posix.join(url.hostname, ...pathSegmentList, normalizedFileName)

		return `/github-assets/${relativePath}`
	} catch {
		return null
	}
}

const downloadGithubImage = async (urlString) => {
	const response = await fetch(urlString, {
		redirect: 'follow',
		headers: {
			'user-agent': 'fre123-nav-github-asset-mirror',
		},
	})

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`)
	}

	const contentType = response.headers.get('content-type') ?? ''
	const relativePublicPath = buildLocalGithubAssetPath(urlString, contentType)
	if (!relativePublicPath) {
		throw new Error('failed to resolve local asset path')
	}

	const relativeFilePath = relativePublicPath.replace(/^\/github-assets\//, '')
	const outputPath = path.join(PUBLIC_GITHUB_ASSET_DIR, ...relativeFilePath.split('/'))
	const fileBuffer = Buffer.from(await response.arrayBuffer())

	if (fileBuffer.length === 0) {
		throw new Error('empty response body')
	}

	await fs.mkdir(path.dirname(outputPath), { recursive: true })
	await fs.writeFile(outputPath, fileBuffer)

	return relativePublicPath
}

const mapWithConcurrency = async (itemList, concurrency, worker) => {
	const resultList = new Array(itemList.length)
	let currentIndex = 0

	const runnerList = Array.from({ length: Math.min(concurrency, itemList.length) }, async () => {
		while (currentIndex < itemList.length) {
			const workerIndex = currentIndex
			currentIndex += 1
			resultList[workerIndex] = await worker(itemList[workerIndex], workerIndex)
		}
	})

	await Promise.all(runnerList)

	return resultList
}

const writeGeneratedFailureFile = async (failedUrlList) => {
	const fileContent = `// Auto-generated by scripts/prepare-github-assets.mjs. Do not edit.
export const GITHUB_ASSET_LOCAL_FAILURE_URL_LIST = ${JSON.stringify(failedUrlList, null, '\t')} as const
`

	await fs.writeFile(GENERATED_FAILURE_FILE, fileContent, 'utf8')
}

const main = async () => {
	console.log('[github-assets] start preparing local mirror...')
	console.log(`[github-assets] project root: ${PROJECT_ROOT}`)
	console.log(`[github-assets] config dir: ${toDisplayPath(CONFIG_DIR)}`)
	console.log(`[github-assets] output dir: ${toDisplayPath(PUBLIC_GITHUB_ASSET_DIR)}`)
	console.log(`[github-assets] concurrency: ${DOWNLOAD_CONCURRENCY}`)

	const { configFileList, fileSummaries, githubImageUrlList } = await collectGithubImageUrlsFromConfig()
	console.log(`[github-assets] scanned ${configFileList.length} config file(s):`)
	for (const configFilePath of configFileList) {
		console.log(`[github-assets]   - ${toDisplayPath(configFilePath)}`)
	}
	console.log('[github-assets] per-file GitHub asset summary:')
	for (const summary of fileSummaries) {
		console.log(
			`[github-assets]   - ${toDisplayPath(summary.filePath)} | string values: ${summary.stringValueCount} | github images: ${summary.githubImageUrlCount}`,
		)
		for (const sampleUrl of summary.sampleUrlList) {
			console.log(`[github-assets]       sample: ${sampleUrl}`)
		}
	}
	console.log(`[github-assets] found ${githubImageUrlList.length} GitHub image url(s) in config`)

	await fs.rm(PUBLIC_GITHUB_ASSET_DIR, { recursive: true, force: true })
	await fs.mkdir(PUBLIC_GITHUB_ASSET_DIR, { recursive: true })
	await fs.rm(path.join(CONFIG_DIR, 'github-asset-local-map.generated.ts'), { force: true })
	console.log(`[github-assets] reset output directory: ${toDisplayPath(PUBLIC_GITHUB_ASSET_DIR)}`)

	if (githubImageUrlList.length === 0) {
		await writeGeneratedFailureFile([])
		console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)
		console.log('[github-assets] no GitHub images found')
		return
	}

	const downloadResults = await mapWithConcurrency(githubImageUrlList, DOWNLOAD_CONCURRENCY, async (githubImageUrl, index) => {
		const progressLabel = `${index + 1}/${githubImageUrlList.length}`
		console.log(`[github-assets] [${progressLabel}] mirroring: ${githubImageUrl}`)

		try {
			const localPublicPath = await downloadGithubImage(githubImageUrl)
			console.log(`[github-assets] [${progressLabel}] success -> ${localPublicPath}`)
			return {
				url: githubImageUrl,
				localPublicPath,
				success: true,
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.warn(`[github-assets] [${progressLabel}] failed -> ${githubImageUrl} (${errorMessage})`)
			return {
				url: githubImageUrl,
				localPublicPath: null,
				success: false,
				error: errorMessage,
			}
		}
	})

	const failedResults = []
	let successCount = 0

	for (const result of downloadResults) {
		if (result?.success && result.localPublicPath) {
			successCount += 1
			continue
		}

		if (result) {
			failedResults.push(result)
		}
	}

	await writeGeneratedFailureFile(
		failedResults.map((item) => {
			return item.url
		}),
	)
	console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)

	console.log(
		`[github-assets] mirrored ${successCount}/${githubImageUrlList.length} asset(s) to public/github-assets`,
	)

	if (failedResults.length > 0) {
		console.warn(`[github-assets] ${failedResults.length} asset(s) failed and will fallback to runtime proxy`)
		for (const failedResult of failedResults.slice(0, 10)) {
			console.warn(`[github-assets] failed: ${failedResult.url} (${failedResult.error})`)
		}
	}
}

main().catch(async (error) => {
	console.error('[github-assets] failed to prepare local mirror:', error)
	await writeGeneratedFailureFile([])
	console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)
})
