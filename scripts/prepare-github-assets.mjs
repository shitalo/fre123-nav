import { promises as fs } from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import { createJiti } from 'jiti'

const PROJECT_ROOT = process.cwd()
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config')
const CONFIG_MODULE_FILE_LIST = [
	path.join(CONFIG_DIR, 'nav.ts'),
	path.join(CONFIG_DIR, 'resource.ts'),
	path.join(CONFIG_DIR, 'website.ts'),
]
const PUBLIC_GITHUB_ASSET_DIR = path.join(PROJECT_ROOT, 'public', 'github-assets')
const GENERATED_FAILURE_FILE = path.join(PROJECT_ROOT, 'config', 'github-asset-local-failures.generated.ts')
const GENERATED_MIRROR_MANIFEST_FILE = path.join(PROJECT_ROOT, 'config', 'github-asset-local-manifest.generated.json')
const DOWNLOAD_CONCURRENCY = 8
const DOWNLOAD_MAX_RETRIES = 2
const DOWNLOAD_RETRY_BASE_DELAY_MS = 500
const MIRROR_MANIFEST_VERSION = 1
const jiti = createJiti(import.meta.url, {
	moduleCache: false,
	fsCache: false,
})

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

const normalizeRemoteImageUrl = (input) => {
	if (!input) {
		return null
	}

	const nestedGithubUrl = extractNestedGithubUrl(input)
	if (nestedGithubUrl) {
		return normalizeRemoteImageUrl(nestedGithubUrl)
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

	try {
		const url = new URL(input)
		if (!/^https?:$/i.test(url.protocol)) {
			return null
		}

		return url.toString()
	} catch {
		return null
	}
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

const getConfigModuleFiles = async () => {
	const fileList = []

	for (const configFilePath of CONFIG_MODULE_FILE_LIST) {
		if (await fileExists(configFilePath)) {
			fileList.push(configFilePath)
		}
	}

	return fileList
}

const toDisplayPath = (inputPath) => {
	return path.relative(PROJECT_ROOT, inputPath) || '.'
}

const hashContent = (content) => {
	return crypto.createHash('sha256').update(content).digest('hex')
}

const buildRemoteImageListHash = (remoteImageUrlList) => {
	return hashContent(JSON.stringify(remoteImageUrlList))
}

const getUrlHostname = (urlString) => {
	try {
		return new URL(urlString).hostname || 'unknown-host'
	} catch {
		return 'unknown-host'
	}
}

const buildDomainSummaryList = (resultList) => {
	const domainCountMap = new Map()

	for (const result of resultList) {
		const hostname = getUrlHostname(result.url)
		domainCountMap.set(hostname, (domainCountMap.get(hostname) ?? 0) + 1)
	}

	return Array.from(domainCountMap.entries())
		.map(([hostname, count]) => {
			return { hostname, count }
		})
		.sort((left, right) => {
			if (right.count !== left.count) {
				return right.count - left.count
			}

			return left.hostname.localeCompare(right.hostname)
		})
}

const loadConfigModuleValue = async (configFilePath) => {
	const moduleValue = await jiti.import(configFilePath, { default: true })
	return moduleValue?.default ?? moduleValue
}

const collectRemoteImageUrlsFromConfig = async () => {
	const configFileList = await getConfigModuleFiles()
	const remoteImageUrlSet = new Set()
	const fileSummaries = []

	for (const configFilePath of configFileList.sort()) {
		const configContent = await loadConfigModuleValue(configFilePath)
		const stringValues = collectStringValues(configContent)
		const fileRemoteImageUrlSet = new Set()

		for (const value of stringValues) {
			const normalizedRemoteImageUrl = normalizeRemoteImageUrl(value)
			if (!normalizedRemoteImageUrl || !isLikelyImageAsset(normalizedRemoteImageUrl)) {
				continue
			}

			remoteImageUrlSet.add(normalizedRemoteImageUrl)
			fileRemoteImageUrlSet.add(normalizedRemoteImageUrl)
		}

		fileSummaries.push({
			filePath: configFilePath,
			stringValueCount: stringValues.length,
			remoteImageUrlCount: fileRemoteImageUrlSet.size,
			sampleUrlList: Array.from(fileRemoteImageUrlSet).slice(0, 3),
		})
	}

	return {
		configFileList: configFileList.sort(),
		fileSummaries,
		remoteImageUrlList: Array.from(remoteImageUrlSet).sort((left, right) => left.localeCompare(right)),
	}
}

const toAbsoluteGithubAssetPath = (localPublicPath) => {
	if (!localPublicPath.startsWith('/github-assets/')) {
		return null
	}

	const relativeFilePath = localPublicPath.replace(/^\/github-assets\//, '')
	return path.join(PUBLIC_GITHUB_ASSET_DIR, ...relativeFilePath.split('/'))
}

const toLocalGithubAssetPublicPath = (absoluteFilePath) => {
	const relativeFilePath = path.relative(PUBLIC_GITHUB_ASSET_DIR, absoluteFilePath)

	if (!relativeFilePath || relativeFilePath.startsWith('..') || path.isAbsolute(relativeFilePath)) {
		return null
	}

	return `/github-assets/${relativeFilePath.split(path.sep).join('/')}`
}

const fileExists = async (filePath) => {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

const readMirrorManifest = async () => {
	try {
		const fileContent = await fs.readFile(GENERATED_MIRROR_MANIFEST_FILE, 'utf8')
		const jsonContent = JSON.parse(fileContent)
		const assetEntryList = Array.isArray(jsonContent?.assetEntryList)
			? jsonContent.assetEntryList.filter((item) => {
					return (
						item &&
						typeof item === 'object' &&
						typeof item.url === 'string' &&
						typeof item.localPublicPath === 'string'
					)
				})
			: []
		const failedUrlList = Array.isArray(jsonContent?.failedUrlList)
			? jsonContent.failedUrlList.filter((item) => {
					return typeof item === 'string'
				})
			: []

		return {
			version: jsonContent?.version ?? 0,
			remoteImageListHash: typeof jsonContent?.remoteImageListHash === 'string' ? jsonContent.remoteImageListHash : '',
			assetEntryList,
			failedUrlList,
		}
	} catch {
		return null
	}
}

const writeMirrorManifest = async ({ remoteImageListHash, assetEntryList, failedUrlList }) => {
	const fileContent = JSON.stringify(
		{
			version: MIRROR_MANIFEST_VERSION,
			remoteImageListHash,
			assetEntryList,
			failedUrlList,
			updatedAt: new Date().toISOString(),
		},
		null,
		'\t',
	)

	await fs.writeFile(GENERATED_MIRROR_MANIFEST_FILE, `${fileContent}\n`, 'utf8')
}

const removeEmptyParentDirectories = async (directoryPath, stopAtPath) => {
	const resolvedStopAtPath = path.resolve(stopAtPath)
	let currentDirectoryPath = path.resolve(directoryPath)

	while (currentDirectoryPath.startsWith(resolvedStopAtPath) && currentDirectoryPath !== resolvedStopAtPath) {
		const directoryEntries = await fs.readdir(currentDirectoryPath)
		if (directoryEntries.length > 0) {
			return
		}

		await fs.rmdir(currentDirectoryPath)
		currentDirectoryPath = path.dirname(currentDirectoryPath)
	}
}

const removeLocalGithubAsset = async (localPublicPath) => {
	const absoluteFilePath = toAbsoluteGithubAssetPath(localPublicPath)
	if (!absoluteFilePath || !(await fileExists(absoluteFilePath))) {
		return false
	}

	await fs.rm(absoluteFilePath, { force: true })
	await removeEmptyParentDirectories(path.dirname(absoluteFilePath), PUBLIC_GITHUB_ASSET_DIR)
	return true
}

const collectLocalGithubAssetFileList = async (directoryPath) => {
	if (!(await fileExists(directoryPath))) {
		return []
	}

	const directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true })
	const fileList = []

	for (const entry of directoryEntries) {
		const fullPath = path.join(directoryPath, entry.name)

		if (entry.isDirectory()) {
			fileList.push(...(await collectLocalGithubAssetFileList(fullPath)))
			continue
		}

		if (entry.isFile()) {
			fileList.push(fullPath)
		}
	}

	return fileList
}

const cleanupOrphanLocalAssets = async (expectedLocalPublicPathSet) => {
	const localFileList = await collectLocalGithubAssetFileList(PUBLIC_GITHUB_ASSET_DIR)
	let removedCount = 0

	for (const localFilePath of localFileList) {
		const localPublicPath = toLocalGithubAssetPublicPath(localFilePath)
		if (!localPublicPath || expectedLocalPublicPathSet.has(localPublicPath)) {
			continue
		}

		await fs.rm(localFilePath, { force: true })
		await removeEmptyParentDirectories(path.dirname(localFilePath), PUBLIC_GITHUB_ASSET_DIR)
		removedCount += 1
		console.log(`[github-assets] removed orphan local asset -> ${localPublicPath}`)
	}

	return removedCount
}

const resolveOutputExtension = (urlString, contentType) => {
	return getExtensionFromUrl(urlString) ?? getExtensionFromContentType(contentType) ?? '.png'
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

const sleep = (delayMs) => {
	return new Promise((resolve) => {
		setTimeout(resolve, delayMs)
	})
}

const downloadRemoteImage = async (urlString) => {
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

const downloadRemoteImageWithRetry = async (urlString, onRetry) => {
	let lastError = null

	for (let attempt = 0; attempt <= DOWNLOAD_MAX_RETRIES; attempt += 1) {
		try {
			return await downloadRemoteImage(urlString)
		} catch (error) {
			lastError = error

			if (attempt < DOWNLOAD_MAX_RETRIES) {
				const delayMs = DOWNLOAD_RETRY_BASE_DELAY_MS * (attempt + 1)
				onRetry?.({
					attempt: attempt + 1,
					maxRetries: DOWNLOAD_MAX_RETRIES,
					delayMs,
					errorMessage: error instanceof Error ? error.message : String(error),
				})
				await sleep(delayMs)
				continue
			}
		}
	}

	throw lastError instanceof Error ? lastError : new Error(String(lastError))
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
	console.log(`[github-assets] manifest file: ${toDisplayPath(GENERATED_MIRROR_MANIFEST_FILE)}`)
	console.log(`[github-assets] concurrency: ${DOWNLOAD_CONCURRENCY}`)
	console.log(`[github-assets] retry policy: first attempt + ${DOWNLOAD_MAX_RETRIES} retries`)
	console.log(`[github-assets] retry backoff: ${DOWNLOAD_RETRY_BASE_DELAY_MS}ms incremental delay per retry`)

	const { configFileList, fileSummaries, remoteImageUrlList } = await collectRemoteImageUrlsFromConfig()
	const remoteImageListHash = buildRemoteImageListHash(remoteImageUrlList)
	const existingMirrorManifest = await readMirrorManifest()

	console.log(`[github-assets] scanned ${configFileList.length} config file(s):`)
	for (const configFilePath of configFileList) {
		console.log(`[github-assets]   - ${toDisplayPath(configFilePath)}`)
	}
	console.log('[github-assets] per-file remote image asset summary:')
	for (const summary of fileSummaries) {
		console.log(
			`[github-assets]   - ${toDisplayPath(summary.filePath)} | string values: ${summary.stringValueCount} | remote images: ${summary.remoteImageUrlCount}`,
		)
		for (const sampleUrl of summary.sampleUrlList) {
			console.log(`[github-assets]       sample: ${sampleUrl}`)
		}
	}
	console.log(`[github-assets] found ${remoteImageUrlList.length} remote image url(s) in config`)
	console.log(`[github-assets] remote image list hash: ${remoteImageListHash}`)

	if (existingMirrorManifest) {
		console.log(
			`[github-assets] loaded existing manifest | version: ${existingMirrorManifest.version} | assets: ${existingMirrorManifest.assetEntryList.length} | failures: ${existingMirrorManifest.failedUrlList.length}`,
		)
	} else {
		console.log('[github-assets] no existing manifest found, a full incremental sync will run')
	}

	await fs.mkdir(PUBLIC_GITHUB_ASSET_DIR, { recursive: true })
	await fs.rm(path.join(CONFIG_DIR, 'github-asset-local-map.generated.ts'), { force: true })
	console.log(`[github-assets] ensured output directory: ${toDisplayPath(PUBLIC_GITHUB_ASSET_DIR)}`)

	if (remoteImageUrlList.length === 0) {
		let removedCount = 0
		for (const assetEntry of existingMirrorManifest?.assetEntryList ?? []) {
			if (await removeLocalGithubAsset(assetEntry.localPublicPath)) {
				removedCount += 1
			}
		}

		await writeMirrorManifest({
			remoteImageListHash,
			assetEntryList: [],
			failedUrlList: [],
		})
		await writeGeneratedFailureFile([])
		const removedOrphanCount = await cleanupOrphanLocalAssets(new Set())
		console.log(`[github-assets] removed ${removedCount} stale local asset(s)`)
		console.log(`[github-assets] removed ${removedOrphanCount} orphan local asset(s)`)
		console.log(`[github-assets] wrote mirror manifest: ${toDisplayPath(GENERATED_MIRROR_MANIFEST_FILE)}`)
		console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)
		console.log('[github-assets] no remote images found')
		return
	}

	const existingAssetEntryMap = new Map(
		(existingMirrorManifest?.assetEntryList ?? []).map((item) => {
			return [item.url, item]
		}),
	)

	if (
		existingMirrorManifest?.version === MIRROR_MANIFEST_VERSION &&
		existingMirrorManifest.remoteImageListHash === remoteImageListHash &&
		existingMirrorManifest.failedUrlList.length === 0
	) {
		const cachedAssetStateList = await mapWithConcurrency(
			existingMirrorManifest.assetEntryList,
			DOWNLOAD_CONCURRENCY,
			async (assetEntry) => {
				const absoluteFilePath = toAbsoluteGithubAssetPath(assetEntry.localPublicPath)
				return absoluteFilePath ? await fileExists(absoluteFilePath) : false
			},
		)
		const missingCacheCount = cachedAssetStateList.filter((item) => {
			return !item
		}).length

		if (missingCacheCount === 0) {
			await writeGeneratedFailureFile([])
			const expectedLocalPublicPathSet = new Set(
				existingMirrorManifest.assetEntryList.map((item) => {
					return item.localPublicPath
				}),
			)
			const removedOrphanCount = await cleanupOrphanLocalAssets(expectedLocalPublicPathSet)
			console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)
			console.log(`[github-assets] removed ${removedOrphanCount} orphan local asset(s)`)
			console.log(
				`[github-assets] fast skip: config unchanged and ${existingMirrorManifest.assetEntryList.length} local asset(s) are ready`,
			)
			return
		}

		console.log(
			`[github-assets] fast skip cancelled: ${missingCacheCount} cached asset(s) are missing locally and will be re-synced`,
		)
	}

	const currentRemoteImageUrlSet = new Set(remoteImageUrlList)
	let removedStaleCount = 0

	for (const assetEntry of existingMirrorManifest?.assetEntryList ?? []) {
		if (currentRemoteImageUrlSet.has(assetEntry.url)) {
			continue
		}

		if (await removeLocalGithubAsset(assetEntry.localPublicPath)) {
			removedStaleCount += 1
			console.log(`[github-assets] removed stale local asset -> ${assetEntry.localPublicPath}`)
		}
	}

	const downloadResults = await mapWithConcurrency(remoteImageUrlList, DOWNLOAD_CONCURRENCY, async (remoteImageUrl, index) => {
		const progressLabel = `${index + 1}/${remoteImageUrlList.length}`
		const existingAssetEntry = existingAssetEntryMap.get(remoteImageUrl)
		const existingAbsoluteFilePath = existingAssetEntry
			? toAbsoluteGithubAssetPath(existingAssetEntry.localPublicPath)
			: null

		if (existingAssetEntry && existingAbsoluteFilePath && (await fileExists(existingAbsoluteFilePath))) {
			console.log(`[github-assets] [${progressLabel}] reused -> ${existingAssetEntry.localPublicPath}`)
			return {
				url: remoteImageUrl,
				localPublicPath: existingAssetEntry.localPublicPath,
				success: true,
				reused: true,
			}
		}

		console.log(`[github-assets] [${progressLabel}] mirroring: ${remoteImageUrl}`)

		try {
			const localPublicPath = await downloadRemoteImageWithRetry(remoteImageUrl, (retryInfo) => {
				console.warn(
					`[github-assets] [${progressLabel}] retry ${retryInfo.attempt}/${retryInfo.maxRetries} after ${retryInfo.delayMs}ms -> ${remoteImageUrl} (${retryInfo.errorMessage})`,
				)
			})
			console.log(`[github-assets] [${progressLabel}] success -> ${localPublicPath}`)
			return {
				url: remoteImageUrl,
				localPublicPath,
				success: true,
				reused: false,
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.warn(`[github-assets] [${progressLabel}] failed -> ${remoteImageUrl} (${errorMessage})`)
			return {
				url: remoteImageUrl,
				localPublicPath: null,
				success: false,
				error: errorMessage,
			}
		}
	})

	const failedResults = []
	const successAssetEntryList = []
	let reusedCount = 0
	let downloadedCount = 0

	for (const result of downloadResults) {
		if (result?.success && result.localPublicPath) {
			successAssetEntryList.push({
				url: result.url,
				localPublicPath: result.localPublicPath,
			})
			if (result.reused) {
				reusedCount += 1
			} else {
				downloadedCount += 1
			}
			continue
		}

		if (result) {
			failedResults.push(result)
		}
	}

	const failedUrlList = failedResults.map((item) => {
		return item.url
	})

	await writeMirrorManifest({
		remoteImageListHash,
		assetEntryList: successAssetEntryList,
		failedUrlList,
	})
	await writeGeneratedFailureFile(failedUrlList)
	const expectedLocalPublicPathSet = new Set(
		successAssetEntryList.map((item) => {
			return item.localPublicPath
		}),
	)
	const removedOrphanCount = await cleanupOrphanLocalAssets(expectedLocalPublicPathSet)
	console.log(`[github-assets] wrote mirror manifest: ${toDisplayPath(GENERATED_MIRROR_MANIFEST_FILE)}`)
	console.log(`[github-assets] wrote failure manifest: ${toDisplayPath(GENERATED_FAILURE_FILE)}`)

	console.log(
		`[github-assets] sync summary | reused: ${reusedCount} | downloaded: ${downloadedCount} | removed stale: ${removedStaleCount} | removed orphan: ${removedOrphanCount} | failed: ${failedResults.length}`,
	)
	console.log(
		`[github-assets] local asset coverage: ${successAssetEntryList.length}/${remoteImageUrlList.length}`,
	)

	if (failedResults.length > 0) {
		console.warn(`[github-assets] ${failedResults.length} asset(s) failed and will fallback to runtime proxy`)
		console.warn('[github-assets] failure summary by domain:')
		for (const summary of buildDomainSummaryList(failedResults)) {
			console.warn(`[github-assets]   - ${summary.hostname}: ${summary.count}`)
		}
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
