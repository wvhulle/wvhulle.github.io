<script>
	import '../app.css';

	export const prerender = true;

	import { base } from '$app/paths';
</script>

<div class="grid place-content-center">
	<a href="{base}/timeseries" class="link">Time series</a>

	<slot />
</div>

<style lang="postcss">
	div {
		display: flex;
		flex-direction: column;
		border: 2px dashed black;
		width: 100vw;
		height: 100vh;
	}
</style>
