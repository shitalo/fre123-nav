<template>
	<div v-if="navList?.length" class="nav-layout">
		<CommonNavBar :nav-list="navList" @select-tab="selectTab" />
		<div id="nav-container">
			<IndexNavGroup
				v-for="(nav, i) in navList"
				:key="nav.group_name"
				:idx="i"
				:group-data="nav"
				:selected-tab="selectedTabs.get(nav.group_name)"
				@select-tab="selectTab(nav.group_name, $event)"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
import type { IGroup } from '~/interface/nav'

const { getNavListStaticDataUrl } = useStaticDataPath()
const route = useRoute()
const selectedTabs = reactive(new Map<string, string>())

const loadNavList = async () => {
	if (import.meta.server) {
		const [{ default: navConfig }, { buildHomeNavList }] = await Promise.all([
			import('~/config/nav'),
			import('~/utils/static-data-builder'),
		])
		return buildHomeNavList(navConfig)
	}

	const response = await fetch(getNavListStaticDataUrl(), {
		headers: {
			accept: 'application/json',
		},
	})

	if (!response.ok) {
		throw createError({
			statusCode: response.status,
			statusMessage: `Failed to load nav list: ${response.statusText}`,
		})
	}

	return await response.json()
}

const { data: navList } = await useAsyncData<IGroup[]>('static-nav-list', loadNavList, {
	default: () => [],
})

const selectTab = (groupName: string, tabName: string) => {
	selectedTabs.set(groupName, tabName)
	if (window.location.hash) {
		window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
	}
}

onMounted(async () => {
	if (!route.hash) return
	for (const group of navList.value ?? []) {
		const tab = group.tab_list.find(({ tab_name }) => route.hash === `#${group.group_name}_${tab_name}`)
		if (!tab) continue
		selectedTabs.set(group.group_name, tab.tab_name)
		await nextTick()
		document.getElementById(`nav_group_${group.group_name}`)?.scrollIntoView({ block: 'start' })
		break
	}
})
</script>

<style scoped>
#nav-container {
	display: grid;
	min-width: 0;
	gap: 28px;
	padding-top: 20px;
}

@media (min-width: 1024px) {
	.nav-layout {
		--directory-width: 188px;
		display: grid;
		grid-template-columns: var(--directory-width) minmax(0, 1fr);
		align-items: start;
		gap: 30px;
	}

	#nav-container {
		grid-column: 2;
		gap: 32px;
		padding-top: 0;
	}
}
</style>
