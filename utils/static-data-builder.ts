import type {
	IResourceSearchItem,
	IResourceSearchPayload,
	IResourceSearchType,
} from '~/interface/resource'

export const DEFAULT_RESOURCE_SEARCH_TYPE = 'search'

type RawNavDetail = {
	title?: string
	url?: string
	icon?: string
	description?: string
	ori_url?: string
	is_show?: boolean
}

type RawNavTab = {
	tab_name?: string
	upper_right_corner?: {
		title?: string
		url?: string
	}
	details?: RawNavDetail[]
}

type RawNavGroup = {
	group_name?: string
	tab_list?: RawNavTab[]
}

type RawResourceItem = {
	name?: string
	url?: string
	icon?: string
	is_show?: boolean
}

type RawResourceType = {
	name?: string
	is_show?: boolean
	list?: RawResourceItem[]
}

export const buildHomeNavList = (navList: readonly RawNavGroup[]) => {
	return navList
		.map((group) => {
			const tabList = (group.tab_list ?? [])
				.map((tab) => {
					const details = (tab.details ?? [])
						.filter((detail) => {
							return (
								detail?.is_show === true &&
								typeof detail.title === 'string' &&
								detail.title.length > 0 &&
								typeof detail.url === 'string' &&
								detail.url.length > 0 &&
								typeof detail.icon === 'string' &&
								detail.icon.length > 0 &&
								typeof detail.description === 'string'
							)
						})
						.map((detail) => {
							return {
								title: detail.title as string,
								url: detail.url as string,
								icon: detail.icon as string,
								description: detail.description as string,
								...(typeof detail.ori_url === 'string' && detail.ori_url.length > 0
									? { ori_url: detail.ori_url }
									: {}),
							}
						})

					if (
						typeof tab.tab_name !== 'string' ||
						tab.tab_name.length === 0 ||
						details.length === 0
					) {
						return null
					}

					const upperRightCorner =
						typeof tab.upper_right_corner?.title === 'string' &&
						tab.upper_right_corner.title.length > 0 &&
						typeof tab.upper_right_corner?.url === 'string' &&
						tab.upper_right_corner.url.length > 0
							? {
									title: tab.upper_right_corner.title,
									url: tab.upper_right_corner.url,
								}
							: undefined

					return {
						tab_name: tab.tab_name,
						...(upperRightCorner ? { upper_right_corner: upperRightCorner } : {}),
						details,
					}
				})
				.filter((tab): tab is NonNullable<typeof tab> => {
					return tab != null
				})

			if (
				typeof group.group_name !== 'string' ||
				group.group_name.length === 0 ||
				tabList.length === 0
			) {
				return null
			}

			return {
				group_name: group.group_name,
				tab_list: tabList,
			}
		})
		.filter((group): group is NonNullable<typeof group> => {
			return group != null
		})
}

const getVisibleResourceTypeList = (
	resourceConfig: Readonly<Record<string, RawResourceType>>,
): IResourceSearchType[] => {
	return Object.entries(resourceConfig)
		.filter(([, item]) => {
			return item?.is_show === true && typeof item.name === 'string' && item.name.length > 0
		})
		.map(([key, item]) => {
			return {
				key,
				name: item.name as string,
			}
		})
}

const buildResourceList = (
	resourceConfig: Readonly<Record<string, RawResourceType>>,
	resourceType: string,
): IResourceSearchItem[] => {
	return (resourceConfig[resourceType]?.list ?? [])
		.filter((item) => {
			return (
				item?.is_show === true &&
				typeof item.name === 'string' &&
				item.name.length > 0 &&
				typeof item.url === 'string' &&
				item.url.length > 0 &&
				typeof item.icon === 'string' &&
				item.icon.length > 0
			)
		})
		.map((item) => {
			return {
				name: item.name as string,
				url: item.url as string,
				icon: item.icon as string,
			}
		})
}

export const resolveResourceSearchType = (
	resourceConfig: Readonly<Record<string, RawResourceType>>,
	resourceType?: string,
) => {
	const resourceTypeList = getVisibleResourceTypeList(resourceConfig)
	const visibleResourceTypeSet = new Set(
		resourceTypeList.map((item) => {
			return item.key
		}),
	)

	if (resourceType && visibleResourceTypeSet.has(resourceType)) {
		return resourceType
	}

	if (visibleResourceTypeSet.has(DEFAULT_RESOURCE_SEARCH_TYPE)) {
		return DEFAULT_RESOURCE_SEARCH_TYPE
	}

	return resourceTypeList[0]?.key ?? DEFAULT_RESOURCE_SEARCH_TYPE
}

export const buildResourceSearchPayload = (
	resourceConfig: Readonly<Record<string, RawResourceType>>,
	resourceType?: string,
): IResourceSearchPayload => {
	const resourceTypeList = getVisibleResourceTypeList(resourceConfig)
	const resolvedResourceType = resolveResourceSearchType(resourceConfig, resourceType)
	const currentResourceType = resourceTypeList.find((item) => item.key === resolvedResourceType) ?? {
		key: resolvedResourceType,
		name: resolvedResourceType,
	}

	return {
		defaultResourceType: DEFAULT_RESOURCE_SEARCH_TYPE,
		resourceType: currentResourceType,
		resourceTypes: resourceTypeList,
		resources: buildResourceList(resourceConfig, resolvedResourceType),
	}
}

export const buildAllResourceSearchPayloads = (
	resourceConfig: Readonly<Record<string, RawResourceType>>,
): Record<string, IResourceSearchPayload> => {
	const resourceTypeList = getVisibleResourceTypeList(resourceConfig)

	return resourceTypeList.reduce<Record<string, IResourceSearchPayload>>((result, item) => {
		result[item.key] = buildResourceSearchPayload(resourceConfig, item.key)
		return result
	}, {})
}
