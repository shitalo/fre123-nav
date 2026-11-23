<template>
	<div
		v-if="pendantConfig.is_show"
		id="navbar-pendant"
		class="z-50 fixed right-[var(--site-gutter)] bottom-4"
	>
		<ul>
			<li
				v-for="(item, i) in pendantConfig.list"
				class="navbar-icon-style"
				:style="{
					color: `${item.icon_color}`,
				}"
				:class="`hover:text-${item.icon_hover_class}`"
			>
				<component :is="item?.url ? 'a' : 'div'" :href="item?.url" target="_blank">
					<IconsFontAwesome
						:icon="item?.icon_class"
						:size="item.icon_size"
						@mouseenter="switchHoverIdx(i)"
						@mouseleave="switchHoverIdx(-1)"
					></IconsFontAwesome>
					<div
						v-if="item?.img"
						:class="`${hoverIdx === i ? 'block' : 'hidden'}`"
						class="absolute top-0 right-[50px] p-[10px] bg-white"
					>
						<img :src="getGithubAssetUrl(item?.img)" class="h-[110px] max-w-fit" alt="" />
						<p class="text-[chocolate] text-[12px] whitespace-nowrap m-0">{{ item?.text }}</p>
					</div>
					<p
						v-else-if="!item?.img && item?.text"
						:class="`${hoverIdx === i ? 'block' : 'hidden'}`"
						class="hover-p w-auto"
					>
						{{ item.text }}
					</p>
				</component>
			</li>
			<transition name="to-top" mode="out-in" class="">
				<li
					v-show="showToTopIcon"
					id="toTopIcon"
				>
					<button
						type="button"
						class="to-top-button"
						aria-label="返回顶部"
						title="返回顶部"
						@click="scrollToTop()"
					>
						<IconsFontAwesome :size="18" icon="fas fa-arrow-up"></IconsFontAwesome>
					</button>
				</li>
			</transition>
		</ul>
	</div>
</template>

<script setup lang="ts">
import { pendantConfig } from '~/config/website'
const { getGithubAssetUrl } = useGithubAsset()

const showQrCode = ref(false)
const showToTopIcon = ref(false)

const hoverIdx = ref(-1)
const switchHoverIdx = (val: number) => {
	hoverIdx.value = val
}

const scrollToTop = () => {
	window.scrollTo({
		top: 0,
		behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
	})
}

const handleScroll = () => {
	showToTopIcon.value = window.scrollY > 180
}

onMounted(() => {
	handleScroll()
	window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.navbar-icon-style {
	@apply w-[35px] h-[35px] mb-[5px] leading-[35px] rounded-[4px] bg-[#f8f9fa] text-center shadow-[0_2px_5px_rgba(0,0,0,0.3)] relative;
}

#navbar-pendant {
	background: transparent;
	border: 0;
	box-shadow: none;
}

#navbar-pendant > ul {
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	list-style: none;
}

// .header-transition {
// 	transition: all 0.3s ease-in-out;
// }
//
.to-top-enter,
.to-top-leave-to {
	opacity: 0;
}
.to-top-enter-to,
.to-top-leave {
	opacity: 1;
}
.to-top-enter-active {
	transition: all 0.3s ease;
}
.to-top-leave-active {
	transition: all 0.3s ease;
}
// ul > li {
// 	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
// 	background-color: #f8f9fa;
// }

#toTopIcon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	margin-bottom: 5px;
	padding: 0;
	border: 0;
	background: transparent;
}

.to-top-button {
	appearance: none;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	width: 44px;
	height: 44px;
	padding: 0;
	border: 1px solid var(--site-glass-edge);
	border-radius: 50%;
	background: var(--site-glass);
	color: var(--site-ink);
	line-height: 1;
	box-shadow: var(--site-glass-shadow);
	backdrop-filter: var(--site-glass-filter);
	cursor: pointer;
	transition:
		transform 180ms ease,
		background-color 180ms ease,
		box-shadow 180ms ease;
}

.to-top-button:hover {
	background: var(--site-surface);
	color: var(--site-accent);
}

.to-top-button:active {
	transform: scale(0.95);
}

.to-top-button:focus-visible {
	outline: 2px solid var(--site-focus);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
	.to-top-button,
	.to-top-enter-active,
	.to-top-leave-active {
		transition: none;
	}

	.to-top-button:active {
		transform: none;
	}
}

.hover-p {
	@apply h-[35px] w-[35px] min-w-[210px] bg-[#f8f9fa] text-center text-black leading-[35px] rounded-[4px] mb-[5px]	shadow-[0_2px_5px_rgba(0,0,0,0.3)] absolute bottom-[-4px] right-[50px] py-0 px-[12px] text-[12px];
}
</style>
