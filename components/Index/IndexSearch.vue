<template>
	<div class="w-full flex items-center justify-center flex-col">
		<template v-if="hasLoadedSearchData">
			<ul class="flex py-2 pl-[4rem] w-full text-sm relative" id="resource-menu">
				<li id="search_tab_anchor" class="anchor text-[14px] h-full"></li>
				<li
					v-for="(item, i) in resourceList"
					:id="`search_tab_${i}`"
					:key="item.name"
					class="flex px-2 div-center hover:text-[#007bff] truncate"
					:class="`${currTab == i ? 'text-[#007bff]' : ''}`"
					@mouseover="slideTo(i)"
					@mouseleave="slideBack()"
					@click="switchResource(i, item.name)"
				>
					<img v-if="item.icon" :src="getGithubAssetUrl(item.icon)" alt="" class="w-[12px] h-[12px]" />
					<div class="ml-1 hidden lg:block">{{ item.name }}</div>
				</li>
			</ul>

			<div class="w-full flex mt-1 rounded-md pr-2 bg-slate-100 items-center cursor-pointer">
				<div
					class="flex items-center min-w-[4rem] cursor-pointer relative hover:bg-[rgba(226,232,240,0.3)] rounded-t-md"
					@mouseover="showResourceList = true"
					@mouseleave="showResourceList = false"
				>
					<span class="text-center py-2 w-full"> {{ currResourceType?.name }} </span>
					<ul
						class="absolute top-[40px] left-0 min-w-[4rem] truncate transition-all duration-500 flex-col shadow-lg rounded-b-md z-[1000] bg-gray-50"
						:class="`${showResourceList ? 'opacity-100 h-auto rounded-b-none' : 'opacity-0 h-0'}`"
					>
						<li
							v-for="resourceType in resourceTypeList"
							:key="resourceType.key"
							class="py-2 w-full text-center cursor-pointer transition-all duration-300 hover:bg-[rgba(226,232,240)]"
							@click="switchResourceType(resourceType.key)"
						>
							{{ resourceType.name }}
						</li>
					</ul>
				</div>
				<div class="h-full relative flex-grow">
					<input
						class="w-full lg:min-w-[600px] bg-slate-100 h-6 px-2 py-1 border-l-[2px] border-l-slate-200 focus:outline-none"
						type="text"
						v-model="keyword"
						:placeholder="generatePlaceholder()"
						@keypress.enter="handleSearch()"
					/>
				</div>
				<div class="justify-end">
					<IconsAppIcon
						name="uil:search"
						size="24"
						class="items-center cursor-pointer hover:scale-105"
						@click="handleSearch()"
					></IconsAppIcon>
				</div>
			</div>
		</template>
		<div v-else class="w-full mt-9">
			<div class="w-full flex mt-1 rounded-md pr-2 bg-slate-100 items-center opacity-70">
				<div class="min-w-[4rem] py-2 text-center text-slate-500">加载中</div>
				<div class="h-6 border-l-[2px] border-l-slate-200 flex-grow"></div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { IResourceSearchItem, IResourceSearchType } from '~/interface/resource'
import useResourceStore from '~/stores/resource'
const { getGithubAssetUrl } = useGithubAsset()

const route = useRoute()
const keyword = ref(route.query.q as string)

const searchStore = useResourceStore()
const resourceTypeList = computed(() => searchStore.getResourceTypeList())

const showResourceList = ref(false)
const selectedResourceType = ref(searchStore.selectedResourceType)
const selectedResource = ref<IResourceSearchItem>()
const hasLoadedSearchData = ref(false)

const currResourceType = ref<IResourceSearchType>()
const getResourceType = (type: string) => {
	currResourceType.value = resourceTypeList.value.find((element) => {
		return element.key == type
	})
	if (!currResourceType.value) {
		currResourceType.value = resourceTypeList.value[0]
		selectedResourceType.value = currResourceType.value?.key as string
		searchStore.setSelectedResourceType(selectedResourceType.value)
	}
}

const currTab = ref(0)

const resourceList = ref<IResourceSearchItem[]>([])
const getResourceList = (resourceType: string) => {
	const list = searchStore.getResourceList(resourceType, false, false)
	resourceList.value = list
	const matchResource = resourceList.value.findLast((element, i) => {
		if (element.name == searchStore.selectedResource) {
			currTab.value = i
			return element
		}
		return
	})
	selectedResource.value = matchResource ? matchResource : list[0]
	currTab.value = matchResource ? resourceList.value.indexOf(matchResource) : 0
}

const handleSearch = () => {
	if (!selectedResource.value?.url) {
		return
	}

	const url = `${selectedResource.value?.url}`.replaceAll('{keyword}', keyword.value)
	navigateTo(url, {
		open: {
			target: '_blank',
		},
	})
}

const generatePlaceholder = () => {
	return selectedResource.value?.name == '全部'
		? '请输入您要搜索的内容...'
		: `在 ${selectedResource.value?.name} 中搜索`
}

const switchResource = (idx: number, name: string) => {
	selectedResource.value = resourceList.value.findLast((element) => {
		return element.name == name
	})
	currTab.value = idx
	searchStore.setSelectedResource(name)
	slideTo(idx)
}

const slideTo = (idx: number) => {
	const dom = document.getElementById(`search_tab_${idx}`)
	if (dom) {
		const w = dom.offsetWidth as number
		const offsetLeft = dom.offsetLeft

		const anchor = document.getElementById('search_tab_anchor')
		if (anchor != null) {
			anchor.style.width = 20 + 'px'
			anchor.style.transitionDuration = '0.3s'
			anchor.style.transform = `translateX(${(w - 20) / 2 + offsetLeft - 64}px)`
		}
	}
}

const slideBack = () => {
	slideTo(currTab.value)
}

const initializeSearchData = async () => {
	searchStore.hydrateFromStorage()
	selectedResourceType.value = searchStore.selectedResourceType
	const resolvedResourceType = await searchStore.ensureRemoteResourceData(selectedResourceType.value)
	selectedResourceType.value = resolvedResourceType
	getResourceType(resolvedResourceType)
	getResourceList(resolvedResourceType)
	hasLoadedSearchData.value = true
	await nextTick()
	slideTo(currTab.value)
}

const switchResourceType = async (val: string) => {
	selectedResourceType.value = val
	const resolvedResourceType = await searchStore.ensureRemoteResourceData(val)
	getResourceType(resolvedResourceType)
	getResourceList(resolvedResourceType)
	selectedResource.value = resourceList.value[0]
	if (selectedResource.value?.name) {
		searchStore.setSelectedResource(selectedResource.value.name)
	}
	showResourceList.value = false
	currTab.value = 0
	searchStore.setSelectedResourceType(resolvedResourceType)
	await nextTick()
	slideTo(0)
}

onMounted(() => {
	initializeSearchData()
})
</script>

<style scoped>
.search-area {
	@apply w-full sticky top-0;
}
.search-result-area {
	@apply mt-[10px] w-full flex flex-row;
}

.div-center {
	@apply justify-center items-center;
}

.anchor {
	position: absolute;
	height: 0px;
	/* width: 20px; */
	bottom: 0;
	opacity: 1;
	z-index: 0;
	border-bottom: 1.5px solid #272828;
}

.active {
	color: #007bff;
	font-weight: bold;
}
</style>
