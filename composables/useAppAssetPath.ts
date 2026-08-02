const normalizeBaseUrl = (baseUrl: string) => {
	if (!baseUrl) {
		return '/'
	}

	return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

export const useAppAssetPath = () => {
	const { app } = useRuntimeConfig()
	const normalizedBaseUrl = normalizeBaseUrl(app.baseURL)

	const resolveAppAssetPath = (assetPath: string) => {
		if (!assetPath) {
			return normalizedBaseUrl
		}

		if (/^(?:https?:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
			return assetPath
		}

		return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, '')}`
	}

	return {
		resolveAppAssetPath,
	}
}
