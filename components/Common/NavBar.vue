<template>
	<nav v-if="navList.length" class="index-nav-directory" aria-label="导航目录" @scroll="closeSubmenu">
		<ul class="directory-list">
			<li
				v-for="(group, index) in navList"
				:key="group.group_name"
				@pointerenter="openSubmenu(index, $event)"
				@pointerleave="leaveGroup($event)"
				@focusin="focusGroup(index, $event)"
				@focusout="leaveGroup($event)"
			>
				<button
					type="button"
					class="directory-group-link"
					:aria-expanded="group.tab_list.length ? openIndex === index : undefined"
					:aria-controls="group.tab_list.length ? `nav-directory-submenu-${index}` : undefined"
					@click="scrollToGroup(group.group_name)"
					@keydown.right.prevent="focusSubmenu(index, $event)"
				>
					<IconsAppIcon
						class="directory-group-icon"
						:name="getNavGroupIcon(group.group_name)"
						:size="19"
					/>
					<span>{{ group.group_name }}</span>
				</button>
				<div
					v-if="group.tab_list.length"
					:id="`nav-directory-submenu-${index}`"
					class="directory-flyout"
					popover="manual"
				>
					<div class="directory-panel">
						<ul class="directory-submenu" :aria-label="group.group_name">
							<li v-for="tab in group.tab_list" :key="tab.tab_name">
								<button
									type="button"
									class="directory-tab"
									@click="scrollToGroup(group.group_name, tab.tab_name)"
								>
									{{ tab.tab_name }}
								</button>
							</li>
						</ul>
					</div>
				</div>
			</li>
		</ul>
	</nav>
</template>

<script setup lang="ts">
import { getNavGroupIcon } from '~/config/nav-icons'
import type { IGroup } from '~/interface/nav'

defineProps<{ navList: IGroup[] }>()

const emit = defineEmits<{
	selectTab: [groupName: string, tabName: string]
}>()

const openIndex = ref<number>()
let openSubmenuElement: HTMLElement | null = null
let openTrigger: HTMLButtonElement | null = null

const closeSubmenu = () => {
	openSubmenuElement?.hidePopover()
	openSubmenuElement = null
	openTrigger = null
	openIndex.value = undefined
}

const openSubmenu = (index: number, event: Event) => {
	if (event instanceof PointerEvent && event.pointerType === 'touch') return
	const group = event.currentTarget as HTMLElement
	const directory = group.closest('.index-nav-directory')
	const submenu = group.querySelector<HTMLElement>('.directory-flyout')
	const trigger = group.querySelector<HTMLButtonElement>('.directory-group-link')
	if (!directory || !submenu || !trigger || submenu === openSubmenuElement) return

	closeSubmenu()
	const triggerRect = trigger.getBoundingClientRect()
	submenu.style.left = `${triggerRect.right}px`
	const directoryInset = directory.getBoundingClientRect().right - triggerRect.right
	submenu.style.setProperty('--directory-inset', `${directoryInset}px`)
	submenu.showPopover()

	const headerBottom = document.getElementById('fre123-header')?.getBoundingClientRect().bottom ?? 0
	const lowestTop = document.documentElement.clientHeight - submenu.offsetHeight - 12
	submenu.style.top = `${Math.max(headerBottom + 8, Math.min(triggerRect.top, lowestTop))}px`

	openIndex.value = index
	openSubmenuElement = submenu
	openTrigger = trigger
}

const focusGroup = (index: number, event: FocusEvent) => {
	if (event.target instanceof HTMLElement && event.target.matches('.directory-group-link:focus-visible')) {
		openSubmenu(index, event)
	}
}

const leaveGroup = (event: PointerEvent | FocusEvent) => {
	const group = event.currentTarget as HTMLElement
	if (!group.contains(openSubmenuElement)) return
	if (event.relatedTarget instanceof Node && group.contains(event.relatedTarget)) return
	if (event instanceof PointerEvent && openSubmenuElement?.querySelector(':focus-visible')) return
	closeSubmenu()
}

const focusSubmenu = (index: number, event: KeyboardEvent) => {
	openSubmenu(index, event)
	openSubmenuElement?.querySelector('button')?.focus()
}

const dismissSubmenu = () => {
	if (openSubmenuElement?.contains(document.activeElement)) openTrigger?.focus()
	closeSubmenu()
}

const handleEscape = (event: KeyboardEvent) => {
	if (!event.defaultPrevented && event.key === 'Escape' && openSubmenuElement) {
		dismissSubmenu()
	}
}

const scrollToGroup = async (groupName: string, tabName?: string) => {
	const section = document.getElementById(`nav_group_${groupName}`)
	if (!section) return
	dismissSubmenu()
	if (tabName) {
		emit('selectTab', groupName, tabName)
		await nextTick()
	}

	section.scrollIntoView({
		behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		block: 'start',
	})
}

onMounted(() => {
	window.addEventListener('resize', closeSubmenu)
	window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
	window.removeEventListener('resize', closeSubmenu)
	window.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.index-nav-directory,
.directory-flyout {
	display: none;
}

@media (min-width: 1024px) {
	.index-nav-directory {
		position: fixed;
		top: calc(var(--site-header-height) + var(--site-content-top-gap));
		left: max(var(--site-gutter), calc((100% - var(--site-max-width)) / 2));
		z-index: 80;
		display: block;
		width: var(--directory-width);
		max-height: calc(100dvh - var(--site-header-height) - 48px);
		padding: 10px;
		border: 1px solid var(--site-glass-edge);
		border-radius: 24px;
		background: var(--site-glass);
		box-shadow: var(--site-glass-shadow);
		backdrop-filter: var(--site-glass-filter);
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.directory-list,
	.directory-submenu {
		display: grid;
		gap: 3px;
	}

	.directory-group-link,
	.directory-tab {
		width: 100%;
		min-height: 40px;
		padding: 8px 12px;
		border-radius: 14px;
		color: var(--site-ink);
		font-size: 14px;
		text-align: left;
		overflow-wrap: anywhere;
	}

	.directory-group-link {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: 600;
	}

	.directory-group-icon {
		flex: none;
		color: #586e89;
	}

	.directory-group-link:hover,
	.directory-group-link[aria-expanded='true'],
	.directory-tab:hover {
		background: var(--site-selected);
		color: var(--site-accent);
	}

	.directory-group-link:active,
	.directory-tab:active {
		background: color-mix(in srgb, var(--site-selected), var(--site-accent) 10%);
		color: var(--site-accent);
	}

	.directory-group-link:hover .directory-group-icon,
	.directory-group-link:active .directory-group-icon,
	.directory-group-link[aria-expanded='true'] .directory-group-icon {
		color: inherit;
	}

	.directory-group-link:focus-visible,
	.directory-tab:focus-visible {
		outline: 2px solid var(--site-focus);
		outline-offset: -2px;
	}

	.directory-flyout:popover-open {
		position: fixed;
		inset: auto;
		display: block;
		box-sizing: content-box;
		width: 203px;
		max-width: none;
		margin: 0;
		/* Keep the space between the trigger and panel hoverable. */
		padding: 0 0 0 calc(var(--directory-inset) + 8px);
		border: 0;
		overflow: visible;
		background: transparent;
		color: inherit;
	}

	.directory-panel {
		max-height: calc(100dvh - var(--site-header-height) - 20px);
		padding: 9px;
		border: 1px solid var(--site-glass-edge);
		border-radius: 18px;
		overflow-y: auto;
		background: color-mix(in srgb, var(--site-glass), var(--site-surface) 38%);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 75%),
			0 2px 5px rgb(30 45 68 / 7%),
			0 12px 28px rgb(30 45 68 / 13%);
		backdrop-filter: var(--site-glass-filter);
		scrollbar-width: thin;
	}

	.directory-tab {
		display: block;
	}
}

@media (prefers-reduced-motion: no-preference) {
	.directory-flyout:popover-open .directory-panel {
		animation: directory-flyout-in 140ms ease-out;
	}
}

@keyframes directory-flyout-in {
	from {
		opacity: 0;
		transform: translateX(-4px);
	}
}
</style>
