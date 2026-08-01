import githubAssetSourceList from '../config/github-asset.json'

const DEFAULT_GITHUB_ASSET_SOURCE = 'javajun'
const GITHUB_ASSET_PROBE_URL = 'https://raw.githubusercontent.com/jquery/jquery/main/package.json'

type GithubAssetStrategy = 'jsdelivr' | 'prefix'
type GithubAssetSourceConfig = (typeof githubAssetSourceList)[number]
type GithubAssetSourceKey = GithubAssetSourceConfig['key']
type GithubAssetStatus = 'idle' | 'probing' | 'ready'
type GithubAssetSource = {
	key: GithubAssetSourceKey
	label: string
	strategy: GithubAssetStrategy
	baseUrl: string
}

export type GithubAssetProbeResult = {
	key: GithubAssetSourceKey
	label: string
	baseUrl: string
	latency: number | null
	available: boolean
}

type ParsedGithubAsset = {
	originalUrl: string
	jsdelivrPath: string | null
}

const GITHUB_ASSET_SOURCE_LIST = githubAssetSourceList as GithubAssetSource[]

const normalizeGithubAssetBaseUrl = (source: GithubAssetSource) => {
	const trimmedBaseUrl = source.baseUrl.replace(/\/+$/, '')

	if (source.strategy === 'prefix') {
		return `${trimmedBaseUrl}/`
	}

	return trimmedBaseUrl
}

const JSDELIVR_HOST_SET = new Set(
	GITHUB_ASSET_SOURCE_LIST.filter((item) => {
		return item.strategy === 'jsdelivr'
	}).map((item) => {
		return new URL(normalizeGithubAssetBaseUrl(item)).host
	}),
)

let githubAssetProbePromise: Promise<GithubAssetSourceKey> | null = null

const GITHUB_ASSET_SOURCE_KEY_SET = new Set<GithubAssetSourceKey>(
	GITHUB_ASSET_SOURCE_LIST.map((item) => item.key),
)
const GITHUB_ASSET_STORAGE_KEY = 'github-asset-source'

const getGithubAssetSource = (key: GithubAssetSourceKey): GithubAssetSource | undefined => {
	return GITHUB_ASSET_SOURCE_LIST.find((item) => {
		return item.key === key
	})
}

const parseGithubAssetUrl = (input: string): ParsedGithubAsset | null => {
	if (!input) {
		return null
	}

	try {
		const url = new URL(input)
		const { hostname, pathname } = url

		if (JSDELIVR_HOST_SET.has(hostname) && pathname.startsWith('/gh/')) {
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

			return {
				originalUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${restPath.join('/')}`,
				jsdelivrPath: `/gh/${owner}/${repo}@${ref}/${restPath.join('/')}`,
			}
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

			return {
				originalUrl: url.toString(),
				jsdelivrPath: `/gh/${owner}/${repo}@${ref}/${restPath.join('/')}`,
			}
		}

		if (hostname === 'github.com') {
			const segments = pathname.split('/').filter(Boolean)

			if (segments.length >= 5 && segments[2] === 'releases' && segments[3] === 'download') {
				return {
					originalUrl: url.toString(),
					jsdelivrPath: null,
				}
			}

			if (segments.length >= 5) {
				const [owner, repo, action, ref, ...restPath] = segments
				if ((action === 'blob' || action === 'raw') && owner && repo && ref && restPath.length > 0) {
					return {
						originalUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${restPath.join('/')}`,
						jsdelivrPath: `/gh/${owner}/${repo}@${ref}/${restPath.join('/')}`,
					}
				}
			}
		}
	} catch (error) {
		return null
	}

	return null
}

const buildGithubAssetUrlWithSource = (input: string, sourceKey: GithubAssetSourceKey) => {
	const parsedAsset = parseGithubAssetUrl(input)
	if (!parsedAsset) {
		return null
	}

	const source = getGithubAssetSource(sourceKey)
	if (!source) {
		return null
	}

	if (source.strategy === 'jsdelivr') {
		if (!parsedAsset.jsdelivrPath) {
			return null
		}

		return `${normalizeGithubAssetBaseUrl(source)}${parsedAsset.jsdelivrPath}`
	}

	return `${normalizeGithubAssetBaseUrl(source)}${parsedAsset.originalUrl}`
}

const createInitialProbeResults = (): GithubAssetProbeResult[] => {
	return GITHUB_ASSET_SOURCE_LIST.map((source) => {
		return {
			key: source.key,
			label: source.label,
			baseUrl: normalizeGithubAssetBaseUrl(source),
			latency: null,
			available: false,
		}
	})
}

const getStoredGithubAssetSource = () => {
	if (!import.meta.client) {
		return DEFAULT_GITHUB_ASSET_SOURCE
	}

	const storedSource = window.localStorage.getItem(GITHUB_ASSET_STORAGE_KEY)

	if (storedSource && GITHUB_ASSET_SOURCE_KEY_SET.has(storedSource)) {
		return storedSource
	}

	return DEFAULT_GITHUB_ASSET_SOURCE
}

const setStoredGithubAssetSource = (sourceKey: GithubAssetSourceKey) => {
	if (!import.meta.client) {
		return
	}

	window.localStorage.setItem(GITHUB_ASSET_STORAGE_KEY, sourceKey)
}

const probeGithubAssetSources = async (onFirstAvailable?: (sourceKey: GithubAssetSourceKey) => void) => {
	let firstAvailableSource: GithubAssetSourceKey | null = null

	const results = await Promise.all(
		GITHUB_ASSET_SOURCE_LIST.map(async (candidate) => {
			const probeBaseUrl = buildGithubAssetUrlWithSource(GITHUB_ASSET_PROBE_URL, candidate.key)
			if (!probeBaseUrl) {
				return {
					key: candidate.key,
					label: candidate.label,
					baseUrl: normalizeGithubAssetBaseUrl(candidate),
					latency: null,
					available: false,
				}
			}

			const startedAt = performance.now()
			const probeUrl = `${probeBaseUrl}${probeBaseUrl.includes('?') ? '&' : '?'}t=${Date.now()}-${Math.random()
				.toString(36)
				.slice(2)}`

			try {
				await fetch(probeUrl, {
					method: 'GET',
					mode: 'no-cors',
					cache: 'no-store',
				})

				if (!firstAvailableSource) {
					firstAvailableSource = candidate.key
					onFirstAvailable?.(candidate.key)
				}

				return {
					key: candidate.key,
					label: candidate.label,
					baseUrl: normalizeGithubAssetBaseUrl(candidate),
					latency: Math.round(performance.now() - startedAt),
					available: true,
				}
			} catch (error) {
				return {
					key: candidate.key,
					label: candidate.label,
					baseUrl: normalizeGithubAssetBaseUrl(candidate),
					latency: null,
					available: false,
				}
			}
		}),
	)

	results.sort((a, b) => {
		if (a.available !== b.available) {
			return a.available ? -1 : 1
		}

		return (a.latency ?? Number.POSITIVE_INFINITY) - (b.latency ?? Number.POSITIVE_INFINITY)
	})

	return {
		results,
		firstAvailableSource,
	}
}

export const useGithubAsset = () => {
	const preferredSource = useState<GithubAssetSourceKey>('github-asset-source', () => {
		return DEFAULT_GITHUB_ASSET_SOURCE
	})
	const sourceStatus = useState<GithubAssetStatus>('github-asset-status', () => {
		return 'idle'
	})
	const sourceResults = useState<GithubAssetProbeResult[]>(
		'github-asset-results',
		createInitialProbeResults,
	)

	const getGithubAssetUrl = (input: string) => {
		const preferredUrl = buildGithubAssetUrlWithSource(input, preferredSource.value)
		if (preferredUrl) {
			return preferredUrl
		}

		const fallbackSource = sourceResults.value.find((source) => {
			return source.available && buildGithubAssetUrlWithSource(input, source.key) != null
		})
		if (fallbackSource) {
			return buildGithubAssetUrlWithSource(input, fallbackSource.key) ?? input
		}

		return input
	}

	const initGithubAssetSource = async () => {
		if (!import.meta.client) {
			return preferredSource.value
		}

		if (sourceStatus.value === 'ready') {
			return preferredSource.value
		}

		preferredSource.value = getStoredGithubAssetSource()

		if (!githubAssetProbePromise) {
			sourceStatus.value = 'probing'
			githubAssetProbePromise = probeGithubAssetSources((sourceKey) => {
				preferredSource.value = sourceKey
				setStoredGithubAssetSource(sourceKey)
			})
				.then(({ results, firstAvailableSource }) => {
					sourceResults.value = results
					preferredSource.value = firstAvailableSource ?? preferredSource.value
					setStoredGithubAssetSource(preferredSource.value)
					return preferredSource.value
				})
				.catch(() => {
					sourceResults.value = createInitialProbeResults()
					preferredSource.value = getStoredGithubAssetSource()
					setStoredGithubAssetSource(preferredSource.value)
					return preferredSource.value
				})
				.finally(() => {
					sourceStatus.value = 'ready'
					githubAssetProbePromise = null
				})
		}

		return await githubAssetProbePromise
	}

	return {
		preferredSource: readonly(preferredSource),
		sourceStatus: readonly(sourceStatus),
		sourceResults: readonly(sourceResults),
		getGithubAssetUrl,
		initGithubAssetSource,
	}
}
