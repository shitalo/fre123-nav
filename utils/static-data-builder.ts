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
								typeof detail.description === 'string'
							)
						})
						.map((detail) => {
							return {
								title: detail.title as string,
								url: detail.url as string,
								icon: typeof detail.icon === 'string' ? detail.icon : '',
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
