import type {
	IResourceSearchItem,
	IResourceSearchPayload,
	IResourceSearchType,
} from '~/interface/resource'
import { DEFAULT_RESOURCE_SEARCH_TYPE } from '~/utils/static-data-builder'

const RESOURCE_STORAGE_KEY = 'fre123_search'
const DEFAULT_RESOURCE_TYPE = DEFAULT_RESOURCE_SEARCH_TYPE

type ResourceSearchOrderMap = Record<string, string[]>
type ResourceListMap = Record<string, IResourceSearchItem[]>

type PersistedResourceState = {
	searchOrder?: ResourceSearchOrderMap
	selectedResourceType?: string
	selectedResource?: string
}

const readPersistedResourceState = (): PersistedResourceState | null => {
	if (!import.meta.client) {
		return null
	}

	try {
		const rawState = window.localStorage.getItem(RESOURCE_STORAGE_KEY)
		if (!rawState) {
			return null
		}

		const parsedState = JSON.parse(rawState) as PersistedResourceState
		return parsedState && typeof parsedState === 'object' ? parsedState : null
	} catch {
		return null
	}
}

const normalizeSearchOrder = (input: unknown): ResourceSearchOrderMap => {
	if (!input || typeof input !== 'object') {
		return {}
	}

	return Object.entries(input).reduce<ResourceSearchOrderMap>((result, [key, value]) => {
		if (!Array.isArray(value)) {
			return result
		}

		const normalizedValue = value.filter((item): item is string => {
			return typeof item === 'string' && item.length > 0
		})

		if (normalizedValue.length > 0) {
			result[key] = normalizedValue
		}

		return result
	}, {})
}

const writePersistedResourceState = (state: PersistedResourceState) => {
	if (!import.meta.client) {
		return
	}

	window.localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(state))
}

const fetchStaticJson = async <T>(url: string): Promise<T> => {
	const response = await fetch(url, {
		headers: {
			accept: 'application/json',
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to load static json: ${response.status} ${response.statusText}`)
	}

	return (await response.json()) as T
}

const useResourceStore = defineStore('fre123_search', () => {
	const searchOrder = ref<ResourceSearchOrderMap>({})
	const selectedResourceType = ref(DEFAULT_RESOURCE_TYPE)
	const selectedResource = ref<string>()
	const hasHydratedFromStorage = ref(false)
	const resourceTypeList = ref<IResourceSearchType[]>([])
	const resourceListMap = ref<ResourceListMap>({})
	const hasLoadedRemoteData = ref(false)
	const isLoadingRemoteData = ref(false)

	const persistState = () => {
		if (!import.meta.client || !hasHydratedFromStorage.value) {
			return
		}

		writePersistedResourceState({
			searchOrder: searchOrder.value,
			selectedResourceType: selectedResourceType.value,
			selectedResource: selectedResource.value,
		})
	}

	const hydrateFromStorage = () => {
		if (!import.meta.client || hasHydratedFromStorage.value) {
			return
		}

		const persistedState = readPersistedResourceState()
		if (persistedState) {
			searchOrder.value = normalizeSearchOrder(persistedState.searchOrder)

			if (typeof persistedState.selectedResourceType === 'string' && persistedState.selectedResourceType) {
				selectedResourceType.value = persistedState.selectedResourceType
			}

			if (typeof persistedState.selectedResource === 'string' && persistedState.selectedResource) {
				selectedResource.value = persistedState.selectedResource
			}
		}

		hasHydratedFromStorage.value = true
		persistState()
	}

	const getSearchOrder = () => {
		return searchOrder
	}

	const normalizeResourceType = (resourceType?: string) => {
		if (typeof resourceType === 'string' && resourceType.length > 0) {
			return resourceType
		}

		if (selectedResourceType.value) {
			return selectedResourceType.value
		}

		return DEFAULT_RESOURCE_TYPE
	}

	const applyRemotePayload = (payload: IResourceSearchPayload) => {
		resourceTypeList.value = payload.resourceTypes
		resourceListMap.value[payload.resourceType.key] = payload.resources
		hasLoadedRemoteData.value = true

		const hasCurrentResourceType = payload.resourceTypes.some((item) => {
			return item.key === selectedResourceType.value
		})

		if (!hasCurrentResourceType) {
			selectedResourceType.value = payload.resourceType.key
		}
	}

	const ensureRemoteResourceData = async (resourceType?: string, force: boolean = false) => {
		const { getResourceSearchStaticDataUrl } = useStaticDataPath()
		const targetResourceType = normalizeResourceType(resourceType)

		if (!force && resourceListMap.value[targetResourceType]?.length) {
			return targetResourceType
		}

		isLoadingRemoteData.value = true

		try {
			let payload: IResourceSearchPayload

			try {
				payload = await fetchStaticJson<IResourceSearchPayload>(
					getResourceSearchStaticDataUrl(targetResourceType),
				)
			} catch (error) {
				if (targetResourceType === DEFAULT_RESOURCE_TYPE) {
					throw error
				}

				payload = await fetchStaticJson<IResourceSearchPayload>(
					getResourceSearchStaticDataUrl(DEFAULT_RESOURCE_TYPE),
				)
			}

			applyRemotePayload(payload)
			return payload.resourceType.key
		} finally {
			isLoadingRemoteData.value = false
		}
	}

	const setSearchOrder = (resourceType: string, resourceList: string[]) => {
		searchOrder.value[resourceType] = resourceList
		persistState()
	}

	const setSelectedResourceType = (resourceType: string) => {
		selectedResourceType.value = resourceType
		persistState()
	}

	const setSelectedResource = (resource: string) => {
		selectedResource.value = resource
		persistState()
	}

	const getResourceList = (
		resourceType: string,
		withOptions: boolean = false,
		isOriginal: boolean = false,
	) => {
		const resourceList = resourceListMap.value[resourceType] ?? []

		if (!withOptions) {
			return isOriginal ? resourceList : formatResourceList(resourceType, resourceList)
		}

		return isOriginal ? resourceList : formatResourceList(resourceType, resourceList)
	}

	const getResourceTypeList = () => {
		return resourceTypeList.value
	}

	const formatResourceList = (resourceType: string, resourceList: IResourceSearchItem[]) => {
		if (!resourceList || resourceList.length === 0) {
			return []
		}

		const customSearchOrder = searchOrder.value[resourceType] ?? []
		if (customSearchOrder.length === 0) {
			return resourceList
		}

		const remainingList = [...resourceList]
		let resultList: IResourceSearchItem[] = []

		customSearchOrder.forEach((name) => {
			remainingList.forEach((element, index) => {
				if (name === element.name) {
					resultList.push(element)
					remainingList.splice(index, 1)
				}
			})
		})

		resultList = resultList.concat(remainingList)
		return resultList
	}

	return {
		searchOrder,
		selectedResourceType,
		selectedResource,
		hasHydratedFromStorage,
		hasLoadedRemoteData,
		isLoadingRemoteData,
		hydrateFromStorage,
		ensureRemoteResourceData,
		getResourceList,
		getResourceTypeList,
		setSearchOrder,
		getSearchOrder,
		setSelectedResourceType,
		setSelectedResource,
	}
})

export default useResourceStore
