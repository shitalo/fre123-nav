<template>
	<aside
		v-if="navList.length > 0"
		ref="navBarRef"
		class="index-nav-directory fixed z-[100] hidden lg:block top-[116px] w-[170px] xl:w-[190px]"
	>
		<div class="index-nav-directory-header">
			<span class="index-nav-directory-title">导航目录</span>
			<span class="index-nav-directory-count">{{ navList.length }}</span>
		</div>
		<ul class="index-nav-directory-list">
			<li
				v-for="(item, i) in navList"
				:key="item.group_name"
				class="index-nav-directory-group"
				@mouseenter="showGroupTabs(i)"
				@mouseleave="hideGroupTabs"
			>
				<button
					type="button"
					class="index-nav-directory-group-button"
					:class="{ 'is-active': activeGroup === i, 'is-expanded': expandedGroup === i }"
					:aria-expanded="expandedGroup === i"
					:aria-controls="`nav-directory-tabs-${i}`"
					@click="scrollToGroup(i)"
				>
					<span class="index-nav-directory-group-name">{{ item.group_name }}</span>
					<span class="index-nav-directory-group-count">{{ item.tab_list.length }}</span>
				</button>
				<div
					v-if="expandedGroup === i"
					:id="`nav-directory-tabs-${i}`"
					class="index-nav-directory-tab-popover"
					role="menu"
				>
					<div class="index-nav-directory-tab-header">
						<span>{{ item.group_name }}</span>
						<span>{{ item.tab_list.length }} 个小类</span>
					</div>
					<ul class="index-nav-directory-tab-list">
						<li v-for="tab in item.tab_list" :key="tab.tab_name">
							<button
								type="button"
								class="index-nav-directory-tab-button"
								role="menuitem"
								@click="scrollToTab(i, tab.tab_name)"
							>
								<span class="index-nav-directory-tab-marker" aria-hidden="true"></span>
								{{ tab.tab_name }}
							</button>
						</li>
					</ul>
				</div>
			</li>
		</ul>
	</aside>
</template>

<script setup lang="ts">
import type { IGroup } from '~/interface/nav'

const props = defineProps<{
	navList: IGroup[]
}>()

const activeGroup = ref(0)
const expandedGroup = ref(-1)
const GROUP_ACTIVE_TOP = 130
let scrollFrameId: number | null = null
let isActiveGroupLocked = false

const getGroupId = (groupName: string) => `nav_group_${groupName}`
const getTabId = (groupName: string, tabName: string) => `nav_group_tab_${groupName}_${tabName}`

const showGroupTabs = (groupIndex: number) => {
	expandedGroup.value = groupIndex
}

const hideGroupTabs = () => {
	expandedGroup.value = -1
}

const lockActiveGroup = (groupIndex: number) => {
	activeGroup.value = groupIndex
	isActiveGroupLocked = true
}


const releaseActiveGroupLock = () => {
	if (isActiveGroupLocked) {
		isActiveGroupLocked = false
		updateActiveGroup()
	}
}

const handleUserScrollIntent = () => {
	releaseActiveGroupLock()
}

const handleKeyboardScrollIntent = (event: KeyboardEvent) => {
	if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
		releaseActiveGroupLock()
	}
}

const scrollToGroup = (groupIndex: number) => {
	const group = props.navList[groupIndex]
	if (!group) return

	lockActiveGroup(groupIndex)
	expandedGroup.value = groupIndex
	document.getElementById(getGroupId(group.group_name))?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}

const scrollToTab = (groupIndex: number, tabName: string) => {
	const group = props.navList[groupIndex]
	if (!group) return

	lockActiveGroup(groupIndex)
	expandedGroup.value = groupIndex
	document.getElementById(getTabId(group.group_name, tabName))?.click()
	document.getElementById(getGroupId(group.group_name))?.scrollIntoView({
		behavior: 'smooth',
		block: 'start',
	})
}

const isAtDocumentBottom = () => {
	const scrollingElement = document.scrollingElement ?? document.documentElement
	return window.innerHeight + scrollingElement.scrollTop >= scrollingElement.scrollHeight - 4
}

const updateActiveGroup = () => {
	if (isActiveGroupLocked || props.navList.length === 0) return

	if (isAtDocumentBottom()) {
		const lastGroupIndex = props.navList.length - 1
		if (activeGroup.value !== lastGroupIndex) {
			activeGroup.value = lastGroupIndex
		}
		return
	}

	let nextActiveGroup = 0
	for (let index = 0; index < props.navList.length; index += 1) {
		const groupElement = document.getElementById(getGroupId(props.navList[index].group_name))
		if (!groupElement) continue

		if (groupElement.getBoundingClientRect().top <= GROUP_ACTIVE_TOP) {
			nextActiveGroup = index
		} else {
			break
		}
	}

	if (activeGroup.value !== nextActiveGroup) {
		activeGroup.value = nextActiveGroup
	}
}

const handleScroll = () => {
	if (scrollFrameId !== null) return

	scrollFrameId = window.requestAnimationFrame(() => {
		scrollFrameId = null
		updateActiveGroup()
	})
}

onMounted(async () => {
	await nextTick()
	updateActiveGroup()
	window.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('wheel', handleUserScrollIntent, { passive: true })
	window.addEventListener('touchmove', handleUserScrollIntent, { passive: true })
	window.addEventListener('keydown', handleKeyboardScrollIntent)
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
	window.removeEventListener('wheel', handleUserScrollIntent)
	window.removeEventListener('touchmove', handleUserScrollIntent)
	window.removeEventListener('keydown', handleKeyboardScrollIntent)
	if (scrollFrameId !== null) {
		window.cancelAnimationFrame(scrollFrameId)
	}
})
</script>

<style scoped>
.index-nav-directory {
	left: max(16px, calc((100vw - 1440px) / 2));
	padding: 8px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	background: rgba(250, 251, 253, 0.82);
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 10px 30px rgba(15, 23, 42, 0.08);
	backdrop-filter: blur(18px) saturate(125%);
	color: #1d1d1f;
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
}

.index-nav-directory-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 8px 9px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.index-nav-directory-title {
	color: #3c3c43;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.01em;
}

.index-nav-directory-count,
.index-nav-directory-group-count {
	color: #8e8e93;
	font-size: 11px;
	font-weight: 400;
}

.index-nav-directory-count {
	min-width: 20px;
	padding: 2px 6px;
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.72);
	text-align: center;
}

.index-nav-directory-list,
.index-nav-directory-tab-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.index-nav-directory-group-button,
.index-nav-directory-tab-button {
	display: flex;
	width: 100%;
	align-items: center;
	border: 0;
	background: transparent;
	text-align: left;
	cursor: pointer;
}

.index-nav-directory-group {
	position: relative;
}

.index-nav-directory-group-button {
	justify-content: space-between;
	min-height: 36px;
	margin-top: 2px;
	padding: 0 9px;
	border: 1px solid transparent;
	border-radius: 9px;
	color: #48484a;
	font-size: 13px;
	font-weight: 500;
	transition:
		background-color 180ms ease,
		border-color 180ms ease,
		color 180ms ease,
		transform 180ms ease;
}

.index-nav-directory-group-button:hover,
.index-nav-directory-group-button.is-active {
	border-color: rgba(0, 113, 227, 0.08);
	background: rgba(232, 242, 255, 0.82);
	color: #0066cc;
}

.index-nav-directory-group-button.is-expanded {
	border-color: rgba(15, 23, 42, 0.07);
	background: rgba(255, 255, 255, 0.84);
	color: #1d1d1f;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.index-nav-directory-group-button:active {
	transform: scale(0.985);
}

.index-nav-directory-group-button:focus-visible,
.index-nav-directory-tab-button:focus-visible {
	outline: 3px solid rgba(0, 113, 227, 0.22);
	outline-offset: 1px;
}

.index-nav-directory-group-name {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.index-nav-directory-group-count {
	margin-left: 8px;
}

.index-nav-directory-tab-list {
	margin: 0;
	padding: 6px;
	list-style: none;
}

.index-nav-directory-tab-popover {
	position: absolute;
	z-index: 20;
	top: -4px;
	left: calc(100% + 2px);
	width: 216px;
	padding-left: 10px;
	animation: index-nav-tab-popover-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.index-nav-directory-tab-popover::before {
	position: absolute;
	top: 20px;
	left: 5px;
	width: 8px;
	height: 8px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.08);
	border-left: 1px solid rgba(15, 23, 42, 0.08);
	background: #fbfcfe;
	content: '';
	transform: rotate(45deg);
}

.index-nav-directory-tab-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px 8px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-bottom: 0;
	border-radius: 12px 12px 0 0;
	background: rgba(251, 252, 254, 0.96);
	color: #3c3c43;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.01em;
}

.index-nav-directory-tab-header span:last-child {
	color: #8e8e93;
	font-size: 11px;
	font-weight: 400;
}

.index-nav-directory-tab-popover .index-nav-directory-tab-list {
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 0 0 12px 12px;
	background: rgba(251, 252, 254, 0.96);
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.05),
		0 14px 32px rgba(15, 23, 42, 0.14);
	backdrop-filter: blur(18px) saturate(125%);
}

.index-nav-directory-tab-button {
	align-items: center;
	gap: 8px;
	min-height: 32px;
	padding: 5px 8px;
	border-radius: 7px;
	color: #48484a;
	font-size: 12px;
	font-weight: 450;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	transition: background-color 160ms ease, color 160ms ease;
}

.index-nav-directory-tab-button:hover {
	background: rgba(232, 242, 255, 0.86);
	color: #0066cc;
}

.index-nav-directory-tab-marker {
	width: 5px;
	height: 5px;
	flex: 0 0 5px;
	border-radius: 50%;
	background: #c7c7cc;
	transition: background-color 160ms ease, transform 160ms ease;
}

.index-nav-directory-tab-button:hover .index-nav-directory-tab-marker {
	background: #0066cc;
	transform: scale(1.35);
}

@keyframes index-nav-tab-popover-in {
	from {
		opacity: 0;
		transform: translateX(-4px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.index-nav-directory-group-button,
	.index-nav-directory-tab-button,
	.index-nav-directory-tab-marker,
	.index-nav-directory-tab-popover {
		animation: none;
		transition: none;
	}
}
</style>
