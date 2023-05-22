<script lang="ts">
	import { extent } from "d3";
	import { scaleTime } from "d3-scale";
	import dayjs from "dayjs";
	import { quintOut } from "svelte/easing";
	import { fade } from "svelte/transition";

	export let timeVariable: string | number | undefined = "x";

	export let data: { x: Date; y: number }[];

	export let width: number;
	export let height: number;

	$: margin = {
		bottom: Math.max(70, 0.1 * height),
		left: Math.max(70, 0.05 * width),
		right: Math.max(40, 0.05 * width),
		top: Math.max(40, 0.1 * height),
	};

	let timeDomain: [number, number];
	$: timeDomain = extent(data, ({ x }): number => x.getTime()) as [
		number,
		number
	];

	$: timeScale = scaleTime()
		.domain(timeDomain)
		.range([margin.left, width - margin.right])
		.nice();

	$: timeTicks = width ? timeScale.ticks() : undefined;

	$: timeAxisPath = `M${margin.left},6
				V0
				H${width - margin.right}
				V6`;

	export let end = dayjs(data[data.length - 1].x as string | Date).toDate();

	export let start = timeVariable
		? dayjs(data[0].x as string | Date).toDate()
		: undefined;

	function xLabel(d: Date) {
		if (end && start && dayjs(end).diff(start, "month") < 1) {
			return dayjs(d).format("DD/MM HH:mm");
		} else {
			return dayjs(d).format("DD/MM/YY");
		}
	}
</script>

<g transform="translate(0, {height - margin.bottom})">
	{#if timeScale && end !== undefined && start !== undefined}
		<text
			transform="translate({timeScale(
				(end.getTime() + start.getTime()) / 2
			)},+50)"
		>
			{timeVariable}
		</text>
	{:else}
		Undefined bounds for x
	{/if}

	<path stroke="currentColor" d={timeAxisPath} fill="none" stroke-width="1" />
	{#if timeTicks && timeScale}
		{#each timeTicks as x, i (x)}
			<g
				in:fade={{
					delay: 200 + i * 150,
					duration: 600,
					easing: quintOut,
				}}
				class="tick"
				transform="translate({timeScale(x)},0)"
			>
				<line stroke="currentColor" y2="6" />
				<text
					fill="currentColor"
					y="9"
					dy="1em"
					text-anchor="middle"
					alignment-baseline="central"
				>
					<tspan>
						{xLabel(x)}
					</tspan>
				</text>
			</g>
		{/each}
	{/if}
</g>

<style>
	.tick {
		font-size: 11px;
	}
</style>
