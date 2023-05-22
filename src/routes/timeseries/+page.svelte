<script lang="ts">
	import range from 'lodash-es/range';
	import TimeSeries from './TimeSeries.svelte';
	const now = new Date();
	let data = range(0, 10000).map((n) => ({
		time: new Date(now.getTime() + n * 3600 * 24 * 7),
		value: Math.sin(n / 1000)
	}));
</script>

<div class="mx-auto">
	<div class="graph">
		<TimeSeries window={10} {data} maxData={1} minData={0} />
	</div>
	<div class="prose">
		<p>
			Read the code at <a
				href="https://github.com/wvhulle/wvhulle.github.io/blob/main/src/routes/timeseries/TimeSeries.svelte"
				>Github</a
			>.
		</p>
	</div>
</div>

<style>
	.graph {
		width: 50vw;
		height: 50vh;
	}
</style>
