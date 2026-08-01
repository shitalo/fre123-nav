<template>
	<div v-if="resolvedIcon">
		<FontAwesomeIcon :icon="resolvedIcon" :style="{ 'font-size': `${size}px` }" />
	</div>
</template>
<script setup lang="ts">
import { config } from '@fortawesome/fontawesome-svg-core'
import { faTelegramPlane } from '@fortawesome/free-brands-svg-icons'
import { faArrowUp, faBlog, faCommentDots, faQrcode } from '@fortawesome/free-solid-svg-icons'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

config.autoAddCss = false

const props = defineProps({
	icon: {
		type: String,
		required: true,
		default: '',
	},
	size: {
		type: Number,
		required: false,
		default: 20,
	},
})

const ICON_MAP: Record<string, IconProp> = {
	'fas fa-comment-dots': faCommentDots,
	'fab fa-telegram-plane': faTelegramPlane,
	'fas fa-blog': faBlog,
	'fas fa-qrcode': faQrcode,
	'fas fa-arrow-up': faArrowUp,
}

const resolvedIcon = computed(() => ICON_MAP[props.icon] ?? null)
</script>
