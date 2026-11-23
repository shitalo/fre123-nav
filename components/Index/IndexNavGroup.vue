<template>
	<section
		v-if="currentTabData"
		:id="`nav_group_${groupData.group_name}`"
		class="index-nav-group"
		:aria-labelledby="`nav-title-${idx}`"
	>
		<header class="resource-heading">
			<h2 :id="`nav-title-${idx}`">
				<IconsAppIcon
					class="resource-heading-icon"
					:name="getNavGroupIcon(groupData.group_name)"
					:size="26"
				/>
				<span>{{ groupData.group_name }}</span>
			</h2>
			<div v-if="groupData.tab_list.length > 1" class="resource-tabs" role="group" :aria-label="groupData.group_name">
				<button
					v-for="tab in groupData.tab_list"
					:key="tab.tab_name"
					type="button"
					class="resource-tab"
					:aria-pressed="currentTabData.tab_name === tab.tab_name"
					:aria-controls="`nav-resources-${idx}`"
					@click="emit('selectTab', tab.tab_name)"
				>
					{{ tab.tab_name }}
				</button>
			</div>
			<a
				v-if="currentTabData.upper_right_corner"
				class="resource-featured"
				:href="currentTabData.upper_right_corner.url"
				target="_blank"
				rel="noopener"
			>
				{{ currentTabData.upper_right_corner.title }}
			</a>
		</header>

		<div :id="`nav-resources-${idx}`" class="resource-grid">
			<StyleTooltip
				v-for="(item, index) in currentTabData.details.slice(0, 100)"
				:key="`${currentTabData.tab_name}-${index}-${item.url}`"
				:content="item.description"
				:nowrap="true"
				:title-element-id="`resource-title-${idx}-${index}`"
				:element-id="`desc-${idx}-${index}`"
				class="resource-card"
				:class="{ 'has-source': item.ori_url }"
			>
				<a class="resource-link" :href="item.url" target="_blank" rel="nofollow noopener">
					<span class="resource-icon" aria-hidden="true">
						<img
							v-if="item.icon?.trim() && iconStates.get(getIconKey(index)) !== 'error'"
							v-check-icon="getIconKey(index)"
							:class="{ 'resource-icon-loading': iconStates.get(getIconKey(index)) !== 'loaded' }"
							:src="getGithubAssetUrl(item.icon)"
							width="36"
							height="36"
							alt=""
							@load="iconStates.set(getIconKey(index), 'loaded')"
							@error="iconStates.set(getIconKey(index), 'error')"
						/>
						<IconsAppIcon v-if="iconStates.get(getIconKey(index)) !== 'loaded'" name="uil:globe" size="100%" />
					</span>
					<span class="resource-copy">
						<span :id="`resource-title-${idx}-${index}`" class="resource-name">{{ item.title }}</span>
						<span :id="`desc-${idx}-${index}`" class="resource-description">{{ item.description }}</span>
					</span>
				</a>
				<a
					v-if="item.ori_url"
					class="resource-source"
					:href="`${item.ori_url}?ref=https://www.fre123.com`"
					target="_blank"
					rel="nofollow noopener"
					:aria-label="`打开 ${item.title} 的源网站`"
					title="打开源网站"
				>
					<IconsAppIcon name="uil:arrow-circle-right" :size="18" />
				</a>
			</StyleTooltip>
		</div>
	</section>
</template>

<script setup lang="ts">
import type { ObjectDirective } from 'vue'
import { getNavGroupIcon } from '~/config/nav-icons'
import type { IGroup } from '~/interface/nav'

const props = defineProps<{
	groupData: IGroup
	idx: number
	selectedTab?: string
}>()

const emit = defineEmits<{
	selectTab: [tabName: string]
}>()

const { getGithubAssetUrl } = useGithubAsset()
const currentTabData = computed(() => {
	const tabs = props.groupData.tab_list
	return tabs.find(({ tab_name }) => tab_name === props.selectedTab) ?? tabs[0]
})
const iconStates = reactive(new Map<string, 'loaded' | 'error'>())
const getIconKey = (index: number) => `${currentTabData.value?.tab_name}-${index}`

const vCheckIcon: ObjectDirective<HTMLImageElement, string> = {
	mounted(image, { value: key }) {
		if (image.complete) {
			iconStates.set(key, image.naturalWidth > 0 ? 'loaded' : 'error')
		}
	},
}
</script>

<style scoped>
.index-nav-group {
	min-width: 0;
	scroll-margin-top: calc(var(--site-header-height) + 20px);
}

.resource-heading {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 9px 16px;
	margin-bottom: 14px;
}

.resource-heading h2 {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
	color: var(--site-ink);
	font-size: 21px;
	font-weight: 700;
	line-height: 1.35;
	overflow-wrap: anywhere;
}

.resource-heading-icon {
	flex: none;
	color: #586e89;
}

.resource-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 2px;
	min-width: 0;
	padding: 3px;
	border-radius: 18px;
	background: #e5e9ef;
}

.resource-tab {
	min-height: 30px;
	padding: 5px 11px;
	border-radius: 15px;
	color: var(--site-muted);
	font-size: 13px;
	overflow-wrap: anywhere;
}

.resource-tab:hover {
	background: rgb(255 255 255 / 48%);
	color: var(--site-ink);
}

.resource-tab[aria-pressed='true'] {
	background: var(--site-surface);
	box-shadow: 0 1px 3px rgb(39 54 75 / 12%);
	color: var(--site-accent);
	font-weight: 600;
}

.resource-featured {
	margin-left: auto;
	color: var(--site-accent);
	font-size: 13px;
	text-decoration: underline;
	text-underline-offset: 3px;
	overflow-wrap: anywhere;
}

.resource-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
}

.resource-card {
	display: flex;
	min-width: 0;
	border: 1px solid rgb(41 56 80 / 5%);
	border-radius: 18px;
	background: var(--site-surface);
	box-shadow: 0 1px 2px rgb(32 49 76 / 4%);
}

.resource-card:hover,
.resource-card:focus-within {
	border-color: #bfd1e7;
	box-shadow: 0 2px 7px rgb(32 49 76 / 8%);
}

.resource-link {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 9px;
	min-width: 0;
	min-height: 76px;
	padding: 10px;
	border-radius: inherit;
	text-decoration: none;
}

.resource-card.has-source .resource-link {
	padding-right: 36px;
}

.resource-icon {
	--resource-icon-size: 36px;
	position: relative;
	display: grid;
	flex: 0 0 var(--resource-icon-size);
	place-items: center;
	width: var(--resource-icon-size);
	height: var(--resource-icon-size);
	color: #62738a;
}

.resource-icon img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: contain;
}

.resource-icon .resource-icon-loading {
	position: absolute;
	visibility: hidden;
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
	.resource-icon {
		transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.resource-card:hover .resource-icon {
		transform: translateY(-2px) scale(1.08);
	}
}

.resource-copy {
	display: grid;
	align-self: stretch;
	align-content: start;
	min-width: 0;
	gap: 3px;
}

.resource-name {
	overflow: hidden;
	color: var(--site-ink);
	font-size: 14px;
	font-weight: 600;
	line-height: 1.35;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.resource-link:hover .resource-name {
	color: var(--site-accent);
}

.resource-description {
	display: -webkit-box;
	overflow: hidden;
	color: var(--site-muted);
	font-size: 12px;
	line-height: 1.4;
	overflow-wrap: anywhere;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.resource-source {
	position: absolute;
	top: 50%;
	right: 5px;
	display: grid;
	place-items: center;
	width: 30px;
	height: 30px;
	border-radius: 50%;
	color: var(--site-muted);
	transform: translateY(-50%);
}

.resource-source:hover {
	background: var(--site-selected);
	color: var(--site-accent);
}

.resource-link:focus-visible,
.resource-source:focus-visible,
.resource-tab:focus-visible,
.resource-featured:focus-visible {
	outline: 2px solid var(--site-focus);
	outline-offset: -2px;
}

@media (max-width: 359px) {
	.resource-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}

@media (max-width: 639px) {
	.resource-heading h2 {
		width: 100%;
	}
}

@media (min-width: 640px) {
	.resource-grid {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 186px), 1fr));
		gap: 12px;
	}

	.resource-link {
		gap: 11px;
		padding-inline: 12px;
	}

	.resource-icon {
		--resource-icon-size: 40px;
	}
}
</style>
