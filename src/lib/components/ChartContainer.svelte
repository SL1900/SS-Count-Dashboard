<script lang="ts">
    import { CategoryScale, Chart, LinearScale, LineController, LineElement, PointElement, TimeScale, Tooltip } from "chart.js";
    import "chartjs-adapter-luxon";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    import { onMount } from "svelte";
    import RangeSlider from "svelte-range-slider-pips";
    import { FormatTimestamp } from "$lib/utils";
    import MultiSelect from "$lib/components/MultiSelect.svelte";

    let ctx: CanvasRenderingContext2D;
    let chartCanvas: HTMLCanvasElement;

    let data: {content: string, timestamp: number, author: string}[];
    let timestamps: number[] = [];
    let labels: string[] = [];
    let values: number[] = [];
    let authors: string[] = [];

    export let data_loaded = false;

    //Time slider
    let slider_values = [0,0];
    let slider_min = 0;
    let slider_max = 0;

    let show_crosses = true;
    let cross_every_n = 10000;
    let line_color = "#36a2eb";

    let chart: Chart;
    function UpdateData(from: number = 0, to: number = 0, each: number = 3) {
        let data_part = data.filter(m=>{
            return ( +(new Date(m.timestamp)) > from && +(new Date(m.timestamp)) < (to || Number.POSITIVE_INFINITY))
        ;});

        let data_length = data_part.length;
        if(data_length < 5000) each = 1;
        else if(data_length <= 10000) each = 2;
        else if(data_length <= 20000) each = 4;
        else if(data_length <= 30000) each = 8;
        else if(data_length <= 40000) each = 16;
        else if(data_length <= 50000) each = 32;
        else each = 64;

        data_part = data_part.filter(m=>{
            return ((+m.content % each == 0) || (+m.content % 1000 == 0)) || (+m.content % cross_every_n == 0);
        });


        let temp_l: string[] = new Array(data_part.length);
        let temp_t: number[] = new Array(data_part.length);
        let temp_v: number[] = new Array(data_part.length);
        let temp_a: string[] = new Array(data_part.length);

        data_part.map((m, i) => {
            temp_l[i] = (new Date(m.timestamp)).toISOString();
            temp_t[i] = +(new Date(m.timestamp));
            temp_v[i] = +m.content;
            temp_a[i] = m.author;
        });

        labels = temp_l;
        timestamps = temp_t;
        values = temp_v;
        authors = temp_a;
    }

    let last_chart_update = 0;
    let chart_update_debounce_time = 100;
    let color_timeout = 0;
    $: {
        line_color;

        clearTimeout(color_timeout);

        if(data && (Date.now() - last_chart_update) > 500) {
            chart.data.datasets[0].borderColor = line_color;
            chart.data.datasets[0].backgroundColor = line_color;
            chart.update();
        } else if(data) {
            color_timeout = setTimeout(() => {
                chart.data.datasets[0].borderColor = line_color;
                chart.data.datasets[0].backgroundColor = line_color;
                chart.update();
            }, 500);
        }
    }
    $: {
        slider_values;
        cross_every_n;
        show_crosses;

        if(data && cross_every_n >= 1000 && (Date.now() - last_chart_update) > chart_update_debounce_time) {
            last_chart_update = Date.now();

            UpdateData(slider_values[0], slider_values[1]);
            UpdateCrosses();
            chart.data.datasets[0].data = values;
            // //@ts-ignore
            chart.data.labels = labels;
            chart.update();
        }
    }
    function UpdateCrosses() {
        //@ts-ignore
        for(let i = 0; i < chart.config.data.datasets[0]["pointStyle"].length; i++) {
            let isCross = +values[i] % cross_every_n == 0;
            if(!show_crosses) isCross = false;

            //@ts-ignore
            chart.config.data.datasets[0]["pointStyle"][i] = isCross ? "cross" : "circle";
            //@ts-ignore
            chart.config.data.datasets[0]["pointRadius"][i] = isCross ? 10 : 1;
        }
    }

    onMount(async () => {
        let data_request = await (await fetch("https://sl-count.duckdns.org/total_messages.json")).json();
        data_loaded = true;

        data = data_request;

        UpdateData();

        let slider_days_start = Math.floor(timestamps[0] / (24 * 60 * 60 * 1000));
        let slider_hours_end = Math.ceil(timestamps[timestamps.length - 1] / (60 * 60 * 1000));

        slider_min = slider_days_start * 24 * 60 * 60 * 1000;
        slider_max = slider_hours_end * 60 * 60 * 1000;

        slider_values = [slider_min, slider_max];

        ctx = chartCanvas.getContext("2d") as CanvasRenderingContext2D;
        Chart.register(ChartDataLabels);
        Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale);
        Chart.register(TimeScale, Tooltip);

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "count",
                    data: values,
                    pointRadius: (new Array(values.length)).fill(1),
                    yAxisID: "y1",
                    pointStyle: (new Array(values.length)).fill("circle"),
                    borderColor: line_color,
                    backgroundColor: line_color,
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                resizeDelay: 100,
                onResize(chart, _) { chart.resize(); },
                scales: {
                    x: { type: "time" },
                    y1: { ticks: { stepSize: 1000 }, position: "left" },
                    y2: { ticks: { stepSize: 1000 }, position: "right", grid: { drawOnChartArea: false } },
                },
                plugins: {
                    datalabels: {
                        align: "left",
                        font: function(context) {
                            return { size: context.chart.width < 800 ? 8 : 12 }
                        },
                        formatter: function(value, context) {
                            return (context.dataset.data[context.dataIndex] as number || 0) % cross_every_n == 0 && show_crosses ? value : "";
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(item) {
                                let value = ["Count: " + values[item.dataIndex]];
                                value.push("Author: " + authors[item.dataIndex]);
                                return value;
                            }
                        }
                    }
                },
            }
        });

        UpdateCrosses();
    });
</script>

<div class="canvas-container {!data_loaded ? "hidden" : ""} bg-white flex-[2_2_0%] w-full xl:w-1/2 relative border-2 border-sky-300 p-2">
    <canvas bind:this={chartCanvas}></canvas>
    <div class="range-container flex flex-col">
        <div class="time-labels flex justify-between">
            <div class="start_time">{FormatTimestamp(slider_values[0])}</div>
            <div class="end_time">{FormatTimestamp(slider_values[1])}</div>
        </div>
        <RangeSlider
            id="time-slider"
            hoverable
            all="label"
            formatter={(v,i,p) => {
                let date = new Date(v);
                return v % 86400 == 0 ? 
                    `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth()+1).toString().padStart(2, "0")}` 
                    : "";
            }}
            pips pipstep={4 * 24}
            step={3_600_000 / 4}
            range pushy
            bind:values={slider_values}
            min={slider_min}
            max={slider_max}
            springValues={{ stiffness: 0.15, damping: 1}}
        />
    </div>
    <div class="flex">
        <div class="flex flex-col mt-4 mr-2 gap-2 border-2 border-sky-300 p-2 rounded">
            <label>Show numbers: <input type="checkbox" bind:checked={show_crosses}></label>
            <div class="flex flex-col">
                <div class="flex flex-row items-center">
                    <div>Show number every:</div>
                    <input class="w-24 border-sky-300 border-2 rounded text-right input ml-1 p-1" bind:value={cross_every_n} type="number">
                </div>
                {#if cross_every_n < 1000}
                    <div class="text-red-700">Number should be higher than 1000</div>
                {/if}
            </div>
        </div>
        <div class="flex flex-col justify-center mt-4 mr-2 gap-2 border-2 border-sky-300 p-2 rounded">
            <label class="flex items-center gap-2">Line color:<input class="rounded w-12 h-6" bind:value={line_color} type="color"></label>
        </div>
    </div>
    <!-- <div class="people-select flex"> -->
    <!--     <div class="text">People selected:</div> -->
    <!--     <MultiSelect options={[ -->
    <!--             { value: "opt1", text: "Option 1", selected: true}, -->
    <!--             { value: "opt2", text: "Option 2", selected: true}, -->
    <!--             { value: "opt3", text: "Option 3", selected: false}, -->
    <!--             { value: "opt4", text: "Option 4", selected: true}, -->
    <!--     ]} /> -->
    <!-- </div> -->
</div>

<style>
    .canvas-container {
        aspect-ratio: 2;
    }
    :global(#time-slider .pipVal) {
        writing-mode: vertical-lr;
        transform: rotate(180deg) translate(50%, -5%);
        font-size: 0.85rem;
    }
</style>
