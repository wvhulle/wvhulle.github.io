<script lang="ts">
	import { type TimeSeries, smoothen } from './utils';

	import DataLine from './DataLine.svelte';
	import TimeAxis from './TimeAxis.svelte';
	import DataAxis from './DataAxis.svelte';

	import dayjs from 'dayjs';

	export let window = 5;
	export let data: TimeSeries[];
	export let timeVariable: keyof TimeSeries | undefined =
		data.length > 0
			? Object.getOwnPropertyNames(data[0]).find(
					(k) => typeof data[0][k] !== 'number' && dayjs(data[0][k]).isValid()
			  )
			: undefined;
	export let dataVariable: keyof TimeSeries | undefined =
		data.length > 0
			? Object.getOwnPropertyNames(data[0]).find((k) => typeof data[0][k] === 'number')
			: undefined;
	export let minData: number | undefined = undefined;
	export let maxData: number | undefined = undefined;

	let smoothData: { x: Date; y: number }[] | undefined;
	let width: number | undefined;
	let height: number | undefined;

	$: smoothData =
		data.length > 0 && timeVariable !== undefined && dataVariable !== undefined
			? smoothen(data, timeVariable.toString(), dataVariable.toString(), window)
			: undefined;
</script>

<div bind:clientWidth={width} bind:clientHeight={height}>
	{#if smoothData && smoothData.length > 0 && width !== undefined && height !== undefined}
		<svg>
			<DataLine data={smoothData} {width} {height} {minData} {maxData} />

			{#if typeof minData === 'number' && typeof maxData === 'number'}
				<DataAxis data={smoothData} {width} {height} {minData} {maxData} {dataVariable} />
			{:else}
				<DataAxis data={smoothData} {width} {height} {dataVariable} />
			{/if}

			<TimeAxis data={smoothData} {width} {height} {timeVariable} />
		</svg>
	{:else}
		No data points.
	{/if}
</div>

<style>
	svg {
		min-width: 100%;
		min-height: 100%;
	}

	div {
		display: flex;
		/*height: 100%;                removed  */
		flex: 1 1 auto;
		min-width: 100%;
		min-height: 100%;
	}
</style>
