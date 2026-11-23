<template>
	<CommonHeader />
	<main id="wrap" class="site-wrap">
		<slot></slot>
	</main>
	<CommonPendant></CommonPendant>
	<CommonFooter></CommonFooter>
</template>

<style>
.site-wrap {
	width: min(var(--site-max-width), calc(100% - 2 * var(--site-gutter)));
	margin-inline: auto;
}

#wrap {
	min-height: calc(100vh - var(--site-header-height) - 72px);
	padding-block: 0 36px;
}

@media (min-width: 1024px) {
	#wrap {
		padding-block: var(--site-content-top-gap) 48px;
	}
}
</style>
