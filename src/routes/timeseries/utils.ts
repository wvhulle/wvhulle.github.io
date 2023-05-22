import clamp from 'lodash-es/clamp';
import isDate from 'lodash-es/isDate';
import sortBy from 'lodash-es/sortBy';

import dayjs from 'dayjs';

export function takeProportion<T>(array: T[], fraction: number) {
	let subArray: T[] = [];

	if (array.length < 1000) {
		subArray = array;
	} else {
		const breakPoint = Math.floor(array.length * fraction);
		const stepSize = Math.ceil(array.length / breakPoint);

		for (let i = 0; i < array.length; i += stepSize) {
			subArray.push(array[i]);
		}
	}

	return subArray;
}
export function movingAverage(ns: number[], windowSize: number) {
	if (Math.round(windowSize) !== windowSize) {
		throw new Error(`Window should be a number.`);
	}

	return ns.reduce((acc: number[], val, i) => {
		acc.push(val);
		if (i >= windowSize - 1) {
			const avg = acc.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
			acc.push(avg);
		}
		return acc;
	}, []);
}

export const dates = (relativeData: TimeSeries[]) =>
	relativeData.map((d) => {
		const rawDate = d.created.toString();
		if (!rawDate) {
			throw new Error(`Raw date is undefined `);
		}
		return new Date(rawDate);
	});

export function computeUpperLimit(relativeData: TimeSeries[]) {
	const values = dates(relativeData);
	const epochs = values.map((v) => v.getTime());
	const max = Math.max(...epochs.filter((v) => isFinite(v)));
	const b = new Date(max);

	return b;
}

export function computeLowerLimit(relativeData: TimeSeries[]): Date {
	const values = dates(relativeData);
	const epochs = values.map((v) => v.getTime());
	const min = Math.min(...epochs.filter((v) => isFinite(v)));
	const a = new Date(min);
	return a;
}

export type TimeSeries = Record<string | number, string | Date | number>;

export function between<T extends TimeSeries, Var extends keyof T>(
	relativeData: T[],
	a: Date,
	b: Date,
	numericalVariable: Var
) {
	const filtered = relativeData.filter((d) => {
		if (!d.created) {
			throw new Error(`Created is undefined.`);
		}
		const created = new Date(d.created.toString());
		return created >= a && created <= b && isFinite(Number(d[numericalVariable]));
	});

	// console.log(`done filtering, ${filtered.length}`);
	return filtered;
}

export function sample<T extends TimeSeries, Key extends keyof T>(
	boundedData: T[],
	key: Key,
	fraction?: number
) {
	const sampledData = sortBy(takeProportion(boundedData, fraction ?? 0.001), (d) => d[key]);
	return sampledData;
}

export const smoothen = (data: TimeSeries[], timeKey: string, dataKey: string, n = 5) =>
	movingAverage(
		data.map((point) => {
			if (!(dataKey in point)) {
				throw new Error(
					`The data key ${dataKey} is not part of the time series point object ${JSON.stringify(
						point
					)}`
				);
			}

			const y = point[dataKey];
			return Number(y);
		}),
		n
	).map((value, index) => {
		const bounded = clamp(index, 0, data.length - 1);
		const point = data[bounded];

		if (!(timeKey in point)) {
			throw new Error(
				`The x header ${timeKey.toString()} is not a valid key of the data point: ${JSON.stringify(
					point
				)}.`
			);
		}

		if (!point[timeKey]) {
			throw new Error(
				`The date ${point[timeKey]} is undefined for point ${JSON.stringify(point)}.`
			);
		}

		const parsed = dayjs(point[timeKey] as string | Date);

		if (!parsed.isValid()) {
			throw new Error(
				`The date ${
					point[timeKey]
				} is not in a format that can be parsed by DayJS for point ${JSON.stringify(
					point
				)}. Parsed ${parsed.toString()}`
			);
		}
		const x = parsed.toDate();

		if (!isDate(x)) {
			throw Error(`Expected x value to be a date, got ${JSON.stringify(x)}`);
		}
		return { x, y: value };
	});
