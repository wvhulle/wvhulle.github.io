<script>
	import '../app.css';
</script>

<div class="grid place-content-center">
	<a href="./timeseries" class="link">Time series</a>

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
