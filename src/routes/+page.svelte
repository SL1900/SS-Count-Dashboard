<script lang="ts">
    import Chart from "chart.js/auto";
    import "chartjs-adapter-luxon";
    import ChartDataLabels from "chartjs-plugin-datalabels";
    // import "chartjs-plugin-zoom";
    import { onMount } from "svelte";

    import data from "../total_messages.json";

    // let labels = data.map(m=>m.timestamp.slice(0,10).replaceAll("-", ".")).reverse();
    // let labels = data.map(m=>m.timestamp).reverse();
    let labels = data.map(m=>(new Date(m.timestamp)).toISOString() ).reverse();
    let values = data.map(m=>m.content).reverse();
    let authors = data.map(m=>m.author).reverse();

    let ctx: CanvasRenderingContext2D;
    let chartCanvas: HTMLCanvasElement;

    let special_numbers: {author: string, value: number}[] = [];
    
    onMount(async () => {
        UpdateSpecial();

        ctx = chartCanvas.getContext("2d") as CanvasRenderingContext2D;
        Chart.register(ChartDataLabels);

        let chart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "count",
                    data: values,
                    pointRadius: 10,
                    yAxisID: "y1",
                    pointStyle: (new Array(values.length)).fill(false)
                },
                ]
            },
            options: {
                scales: {
                    x: { type: "time" },
                    y1: { ticks: { stepSize: 100 }, position: "left" },
                    y2: { ticks: { stepSize: 100 }, position: "right", grid: { drawOnChartArea: false } },
                },
                plugins: {
                    datalabels: {
                        align: "left",
                        formatter: function(value, context) {
                            return (context.dataset.data[context.dataIndex] as number || 0) % 1000 == 0 ? value : "";
                        }
                    }
                    // zoom: {
                    //     zoom: {
                    //         wheel: {
                    //             enabled: true
                    //         },
                    //     }
                    // }
                }
            }
        });

        for(let i = 0; i < values.length; i += 1000) {
            //@ts-ignore
            chart.config.data.datasets[0]["pointStyle"][i] = "cross";
        }
        chart.update();
    });

    function UpdateSpecial() {
        for(let i = 0; i < values.length; i++) {
            if(+values[i] % 1000 !== 0) continue;

            special_numbers.push({
                author: authors[i],
                value: Number.parseInt(values[i])
            });
        }
        //@ts-ignore
        special_numbers = special_numbers;
    }
</script>

<main class="flex max-h-screen p-4 flex-wrap">
    <div class="w-64 flex flex-col">
        <div class="font-bold uppercase">List of special numbers</div>
        <table>
            <tbody>
                {#each special_numbers as sn}
                    <tr>
                        <td class="p-1 border-sky-800 border-2">{sn.author}</td>
                        <td class="p-1 border-sky-800 border-2">{sn.value}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="canvas-container flex-1 border-2 border-sky-300 p-2 m-2">
        <canvas class="flex-1" bind:this={chartCanvas}></canvas>
    </div>
</main>
