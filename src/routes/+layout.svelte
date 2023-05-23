<script>
	import '../app.css';

	import { base } from '$app/paths';
</script>

<div class="flex flex-col h-full mx-auto relative">
	<div
		class="p-2 bg-white mb-4 border-b border-black flex flex-row gap-8 place-content-center text-lg sticky top-0 items-center"
	>
		<a href="{base}/" class="link">Home</a>

		<div class="flex flex-row gap-8 p-2 border border-black items-center">
			<span class="text-gray-500">Demos</span>
			<a href="{base}/timeseries" class="link">Time series</a>
		</div>
	</div>
	<slot />
</div>

<style lang="postcss">
	a {
		display: block;
		position: relative;
		padding: 0.2em 0;
	}

	/* Fade in */
	a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 0.1em;
		background-color: black;
		opacity: 0;
		transition: opacity 300ms, transform 300ms;
	}

	a:hover::after,
	a:focus::after {
		opacity: 1;
		transform: translate3d(0, 0.2em, 0);
	}
	div a::after {
		opacity: 1;
		transform: scale(0);
		transform-origin: center;
	}

	div a:hover::after,
	div a:focus::after {
		transform: scale(1);
	}
</style>
