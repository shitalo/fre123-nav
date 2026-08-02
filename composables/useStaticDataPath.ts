const normalizeBaseUrl = (baseUrl: string) => {
	if (!baseUrl) {
		return '/'
	}

	return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

const resolveStaticDataUrl = (relativePath: string) => {
	const { app } = useRuntimeConfig()
	return `${normalizeBaseUrl(app.baseURL)}${relativePath.replace(/^\/+/, '')}`
}

export const useStaticDataPath = () => {
	const getNavListStaticDataUrl = () => {
		return resolveStaticDataUrl('static-data/nav-list.json')
	}

	const getResourceSearchStaticDataUrl = (resourceType: string) => {
		return resolveStaticDataUrl(`static-data/resource-search/${resourceType}.json`)
	}

	return {
		getNavListStaticDataUrl,
		getResourceSearchStaticDataUrl,
	}
}
