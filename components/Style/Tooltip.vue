<template>
	<div
		ref="rootElement"
		@mouseenter="showDetails"
		@mouseleave="hideDetails"
		@focusin="showDetails"
		@focusout="hideDetails"
	>
		<div class="resource-preview-trigger">
			<slot />
		</div>
		<div
			v-if="detailsVisible"
			class="resource-preview-bubble"
			:class="{ 'is-above': opensAbove, invisible: !bubbleStyle }"
			:style="bubbleStyle"
			aria-hidden="true"
		>
			<div ref="bubbleContent" class="resource-preview-details">
				<strong v-if="clippedTitle">{{ clippedTitle }}</strong>
				<p v-if="description" ref="bubbleDescription" :class="{ 'is-single-line': descriptionFitsOnOneLine }">
					{{ description }}
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	content: string
	titleElementId: string
}>()

const description = computed(() => props.content.trim())
const rootElement = ref<HTMLElement | null>(null)
const bubbleContent = ref<HTMLElement | null>(null)
const bubbleDescription = ref<HTMLElement | null>(null)
const detailsVisible = ref(false)
const clippedTitle = ref('')
const descriptionFitsOnOneLine = ref(false)
const opensAbove = ref(false)
const bubbleStyle = ref<Record<string, string>>()
let positionFrame = 0

const positionBubble = () => {
	if (!rootElement.value || !bubbleContent.value) return

	const card = rootElement.value.getBoundingClientRect()
	const viewport = document.documentElement
	const headerBottom = document.getElementById('fre123-header')?.getBoundingClientRect().bottom ?? 0
	const viewportPadding = 12
	const gap = 12
	const topEdge = Math.max(0, headerBottom) + viewportPadding
	const bottomEdge = viewport.clientHeight - viewportPadding
	if (card.bottom <= topEdge || card.top >= bottomEdge) {
		closeDetails()
		return
	}

	const spaceAbove = card.top - topEdge - gap
	const spaceBelow = bottomEdge - card.bottom - gap
	const bubbleHeight = bubbleContent.value.scrollHeight + 2
	opensAbove.value = bubbleHeight > spaceBelow && spaceAbove > spaceBelow

	const width = bubbleContent.value.offsetWidth + 2
	const anchor = card.left + card.width / 2
	const left = Math.min(Math.max(anchor - width / 2, viewportPadding), viewport.clientWidth - viewportPadding - width)
	bubbleStyle.value = {
		left: `${left}px`,
		top: `${opensAbove.value ? card.top - gap : card.bottom + gap}px`,
		'--bubble-arrow-x': `${Math.min(Math.max(anchor - left, 20), width - 20)}px`,
		'--bubble-content-height': `${Math.max(0, (opensAbove.value ? spaceAbove : spaceBelow) - 2)}px`,
	}

	nextTick(() => {
		const element = bubbleDescription.value
		if (!element) return

		const lineHeight = parseFloat(getComputedStyle(element).lineHeight)
		descriptionFitsOnOneLine.value = element.offsetHeight < lineHeight * 1.5
	})
}

const schedulePosition = () => {
	if (positionFrame) return
	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = 0
		positionBubble()
	})
}

const isClipped = (element: HTMLElement | null) =>
	element !== null &&
	(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)

const closeDetails = () => {
	detailsVisible.value = false
	descriptionFitsOnOneLine.value = false
	bubbleStyle.value = undefined
	window.removeEventListener('keydown', dismissOnEscape)
	window.removeEventListener('scroll', schedulePosition)
	window.removeEventListener('resize', schedulePosition)
	window.cancelAnimationFrame(positionFrame)
	positionFrame = 0
}

const dismissOnEscape = (event: KeyboardEvent) => {
	if (event.key === 'Escape') closeDetails()
}

const showDetails = (event: MouseEvent | FocusEvent) => {
	if (event.type === 'focusin' && !(event.target instanceof Element && event.target.matches(':focus-visible'))) return

	const title = document.getElementById(props.titleElementId)
	clippedTitle.value = title && isClipped(title) ? title.textContent ?? '' : ''
	if (!description.value && !clippedTitle.value) return

	detailsVisible.value = true
	window.addEventListener('keydown', dismissOnEscape)
	window.addEventListener('scroll', schedulePosition, { passive: true })
	window.addEventListener('resize', schedulePosition)
	nextTick(positionBubble)
}

const hideDetails = (event: MouseEvent | FocusEvent) => {
	const root = rootElement.value
	if (event.type === 'mouseleave' && root?.querySelector(':focus-visible')) return
	if (event.type === 'focusout') {
		if (root?.matches(':hover')) return
		if (event.relatedTarget instanceof Node && root?.contains(event.relatedTarget)) return
	}
	closeDetails()
}

onBeforeUnmount(closeDetails)
</script>

<style scoped>
.resource-preview-trigger {
	position: relative;
	display: flex;
}

.resource-preview-bubble {
	--bubble-background: #eaf2fc;
	--bubble-border: #b7cbe4;
	--bubble-arrow-background: #f1f6fd;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 90;
	width: min(280px, calc(100vw - 40px));
	border: 1px solid var(--bubble-border);
	border-radius: 18px;
	background: linear-gradient(160deg, rgb(255 255 255 / 45%), transparent 70%), var(--bubble-background);
	color: var(--site-ink);
	box-shadow:
		inset 0 1px 0 rgb(255 255 255 / 90%),
		0 2px 5px rgb(30 51 77 / 9%),
		0 10px 26px rgb(30 51 77 / 17%);
	transform-origin: var(--bubble-arrow-x) top;
}

.resource-preview-bubble::before {
	position: absolute;
	bottom: 100%;
	inset-inline: 0;
	height: 14px;
	content: '';
}

.resource-preview-bubble::after {
	position: absolute;
	top: -7px;
	left: var(--bubble-arrow-x);
	width: 12px;
	height: 12px;
	border-top: 1px solid var(--bubble-border);
	border-left: 1px solid var(--bubble-border);
	border-top-left-radius: 3px;
	background: var(--bubble-arrow-background);
	transform: translateX(-50%) rotate(45deg);
	content: '';
}

.resource-preview-bubble.is-above {
	translate: 0 -100%;
	transform-origin: var(--bubble-arrow-x) bottom;
}

.resource-preview-bubble.is-above::before {
	top: 100%;
	bottom: auto;
}

.resource-preview-bubble.is-above::after {
	top: auto;
	bottom: -7px;
	background: var(--bubble-background);
	transform: translateX(-50%) rotate(225deg);
}

.resource-preview-details {
	max-height: var(--bubble-content-height, none);
	padding: 10px 12px;
	overflow: auto;
	overscroll-behavior: contain;
	font-size: 12px;
	line-height: 1.55;
	overflow-wrap: anywhere;
}

.resource-preview-details strong {
	display: block;
	margin-bottom: 3px;
	font-weight: 600;
	text-align: center;
}

.resource-preview-details .is-single-line {
	text-align: center;
}

@media (prefers-reduced-motion: no-preference) {
	.resource-preview-bubble:not(.invisible) {
		animation: resource-preview-in var(--site-transition, 160ms ease-out);
	}
}

@media (prefers-reduced-transparency: no-preference) and (prefers-contrast: no-preference) {
	@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
		.resource-preview-bubble {
			--bubble-background: rgb(234 242 252 / 94%);
			-webkit-backdrop-filter: var(--site-glass-filter);
			backdrop-filter: var(--site-glass-filter);
		}
	}
}

@media (prefers-contrast: more) {
	.resource-preview-bubble {
		--bubble-background: var(--site-surface);
		--bubble-border: var(--site-glass-edge);
		--bubble-arrow-background: var(--site-surface);
		background: var(--bubble-background);
	}
}

@keyframes resource-preview-in {
	from {
		opacity: 0;
		scale: 0.965;
	}
}
</style>
