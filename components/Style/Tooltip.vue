<template>
	<div
		class="relative"
		@mouseenter="showToolTip"
		@mouseleave="hideToolTip"
		@focusin="showToolTip"
		@focusout="hideToolTip"
	>
		<slot></slot>
		<div
			ref="tooltipRef"
			:class="[
				tooltipVisible ? 'block' : 'hidden',
				!tooltipReady ? 'invisible' : '',
				tooltipPlacement === 'up' ? 'tooltip-up' : '',
				nowrap ? 'tooltip-wrap' : 'whitespace-nowrap',
			]"
			:style="tooltipStyle"
			aria-hidden="true"
			class="z-20 tooltip px-2 py-[3px] text-[12px] leading-[22px] text-white bg-[#323233] bg-opacity-[85%] rounded"
		>
			<strong v-if="tooltipTitle" class="block font-semibold">{{ tooltipTitle }}</strong>
			{{ content }}
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps({
	content: {
		type: String,
		default: '',
	},
	nowrap: {
		type: Boolean,
		default: false,
	},
	// JX-TODO 接收需要控制的 dom 节点 ID，这里先用 ID 来控制，后续可考虑优化
	elementId: {
		type: String,
		default: '',
	},
	titleElementId: {
		type: String,
		default: '',
	},
	forceShow: {
		type: Boolean,
		default: false,
	},
	position: {
		type: String,
		default: 'down',
	},
})
const tooltipVisible = ref(false)
const tooltipReady = ref(false)
const tooltipTitle = ref('')
const tooltipPlacement = ref<'up' | 'down'>('down')
const tooltipRef = ref<HTMLElement | null>(null)
const rootElement = ref<HTMLElement | null>(null)
const tooltipStyle = ref<Record<string, string>>({})

let viewportListenersAttached = false
let positionFrame: number | null = null

const updateTooltipPosition = () => {
	if (!tooltipVisible.value || !rootElement.value || !tooltipRef.value) return

	const rootRect = rootElement.value.getBoundingClientRect()
	const tooltipElement = tooltipRef.value
	const gap = 15

	// Set the width before measuring so wrapped descriptions get their real height.
	if (props.nowrap) {
		tooltipElement.style.width = `${rootRect.width}px`
	}

	const tooltipRect = tooltipElement.getBoundingClientRect()
	const canPlaceAbove = rootRect.top >= tooltipRect.height + gap
	const needsAbove = rootRect.bottom + tooltipRect.height + gap > window.innerHeight
	const placement =
		props.position === 'up'
			? canPlaceAbove
				? 'up'
				: 'down'
			: needsAbove && canPlaceAbove
				? 'up'
				: 'down'

	tooltipPlacement.value = placement

	const tooltipWidth = props.nowrap ? rootRect.width : tooltipRect.width
	const viewportPadding = 8
	const minCenter = tooltipWidth / 2 + viewportPadding
	const maxCenter = window.innerWidth - tooltipWidth / 2 - viewportPadding
	const center = Math.min(
		Math.max(rootRect.left + rootRect.width / 2, minCenter),
		Math.max(minCenter, maxCenter),
	)

	tooltipStyle.value = {
		left: `${center}px`,
		top: `${placement === 'up' ? rootRect.top - gap : rootRect.bottom + gap}px`,
		...(props.nowrap ? { width: `${rootRect.width}px` } : {}),
	}
	tooltipReady.value = true
}

const handleViewportChange = () => {
	if (!tooltipVisible.value || positionFrame !== null) return

	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = null
		updateTooltipPosition()
	})
}

const attachViewportListeners = () => {
	if (viewportListenersAttached) return

	viewportListenersAttached = true
	window.addEventListener('scroll', handleViewportChange, true)
	window.addEventListener('resize', handleViewportChange)
}

const detachViewportListeners = () => {
	if (!viewportListenersAttached) return

	viewportListenersAttached = false
	window.removeEventListener('scroll', handleViewportChange, true)
	window.removeEventListener('resize', handleViewportChange)
	if (positionFrame !== null) {
		window.cancelAnimationFrame(positionFrame)
		positionFrame = null
	}
}

const hideToolTip = (event: MouseEvent | FocusEvent) => {
	const root = rootElement.value
	if (event.type === 'mouseleave' && root?.querySelector(':focus-visible')) return
	if (event.type === 'focusout' && root?.matches(':hover')) return

	tooltipVisible.value = false
	tooltipReady.value = false
	detachViewportListeners()
}

const isClipped = (element: HTMLElement | null) =>
	element !== null &&
	(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)

const showToolTip = (event: MouseEvent | FocusEvent) => {
	if (event.type === 'focusin' && !(event.target instanceof HTMLElement && event.target.matches(':focus-visible'))) return

	rootElement.value = event.currentTarget as HTMLElement

	const title = document.getElementById(props.titleElementId)
	tooltipTitle.value = title && isClipped(title) ? title.textContent ?? '' : ''
	const description = document.getElementById(props.elementId)
	if (!props.forceShow && !tooltipTitle.value && !isClipped(description)) return

	if (!tooltipVisible.value) {
		tooltipReady.value = false
	}
	tooltipVisible.value = true
	attachViewportListeners()
	nextTick(updateTooltipPosition)
}

onBeforeUnmount(() => {
	detachViewportListeners()
})
</script>

<style scoped>
.tooltip {
	position: fixed;
	left: 0;
	top: 0;
	transform: translate(-50%, 0);
	pointer-events: none;
	will-change: transform;

	&:after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -100%);
		width: 0px;
		height: 0px;
		border: 5px solid transparent;
		border-bottom: 5px solid rgba(50, 50, 51, 0.85);
	}
}

.tooltip-up {
	transform: translate(-50%, -100%);

	&:after {
		top: auto;
		bottom: 0;
		transform: translate(-50%, 100%);
		border-bottom-color: transparent;
		border-top-color: rgba(50, 50, 51, 0.85);
	}
}

.tooltip-wrap {
	overflow-wrap: anywhere;
}
</style>
