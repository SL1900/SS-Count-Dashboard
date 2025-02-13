<script lang="ts">
 
    // import "chartjs-plugin-zoom";
    import ChartContainer from "$lib/components/ChartContainer.svelte";
    import { BarLoader } from "svelte-loading-spinners";

    let data_loaded = false;
</script>

<svelte:head>
    <meta name="description" content="Graph of StellaSora official discord server #counting channel" >
</svelte:head>

<main class="main-element h-full overflow-x-hidden min-h-screen">
    <!-- HEADER -->
    <div class="w-full gap-3 text-center p-2 font-bold text-4xl page-title flex flex-wrap max-w-full box-border justify-center">
        <a href="http://discord.gg/hNDKSCuD8G">
            <div>StellaSora</div>
            <div class="text-xs flex justify-center under-text underline">discord server</div>
        </a>
        <div>-</div>
        <div>#counting</div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="flex max-h-screen pr-2 pl-2 flex-wrap">
        {#if !data_loaded}
            <div class="bg-white flex justify-center items-center flex-[3_3_0%] w-full xl:w-1/2 relative border-2 border-sky-300 p-2 m-2">
                <BarLoader size="120" color="#6666ff" />
            </div>
        {/if}
        <ChartContainer bind:data_loaded />
        <iframe class="flex-1 min-h-96" title="KarmaSkeleton" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRdkxOhKVUS0H831xeSF4J5HLeMP-vcdNoDt6y64n3hHC1lVnuLhfD-iIyqKSlqQmMR4pSk7C-tWrFn/pubhtml?widget=true&amp;headers=false"></iframe>
    </div>
</main>

<style>
    iframe {
        min-width: 30%;
    }

    @font-face {
        font-family: "krunch";
        src: url("/fonts/krunch_italic.ttf");
    }

    .page-title {
        font-family: "krunch";
    }
    .under-text {
        line-height: 0;
    }
    .main-element::after {
        content: "";
        position: absolute;
        /* inset: -50%; */
        inset: 0;
        --grid-color: #cccccc22;
        --grid-size: 20px;
        background-size: var(--grid-size) var(--grid-size);
        background-image: 
            repeating-linear-gradient(45deg, transparent calc(50% - 1px), var(--grid-color) 50%, transparent calc(50% + 1px), transparent),
            repeating-linear-gradient(-45deg, transparent calc(50% - 1px), var(--grid-color) 50%, transparent calc(50% + 1px), transparent)
        ;
        z-index: -1;
    }
</style>
