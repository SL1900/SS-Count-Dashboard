<script lang="ts">
    type Option = {
        value: string,
        text: string,
        selected: boolean
    };
    export let options: Option[] = [];

    let active = false;

    let input_value: string = "";
    let input_element: HTMLInputElement;

    let options_shown: Option[] = [];
    let selected_list: Option[] = [];

    $: {
        input_value;
        options_shown = options.filter(o=>o.text.toLowerCase().includes(input_value.toLowerCase()));
    }
    $: {
        options;
        selected_list = options.filter(o=>o.selected);
    }
    let focus = false;

    function HandleFocusLeave(node: HTMLElement, cb: Function) {
        function Handle() { if(!node.contains(document.activeElement)) cb();}
        document.addEventListener("focusin", Handle);
        return { destroy: () => { document.removeEventListener("focusin", Handle); } }
    }
    function HandleClickOutside(node: HTMLElement, cb: Function) {
        function Handle(event: MouseEvent) { if(!node.contains(event.target as Node)) cb(); }
        document.addEventListener("click", Handle);
        return { destroy: () => { document.removeEventListener("click", Handle); } }
    }
    function ToggleSelect(value: string) {
        let index = options.findIndex(e=>e.value==value);
        options[index].selected = !options[index].selected;
    }
    function OnClick(event: MouseEvent | KeyboardEvent) {
        active = true;
        setTimeout(()=>{ input_element.focus(); },100);
    }
</script>

<div
    role="button"
    tabindex="0"
    class="flex flex-col flex-1 relative box-content border-red-400 border-2 min-h-8 p-1 gap-2 rounded"
    on:click={OnClick}
    on:keydown={OnClick}
    use:HandleFocusLeave={()=>{ active = false}}
    use:HandleClickOutside={()=>{ active = false}}
>
    <div class="selected-list flex w-full min-h-8 gap-1" >
        {#each selected_list as option}
            <div class="selected-list-item border-2 border-green-500 px-1">{option.text}</div>
        {/each}
    </div>
    <div class="dropdown absolute border-2 border-blue-500 w-full">
        {#if active}
            <input bind:value={input_value} bind:this={input_element} class="border-2 border-black" type="text">
            <div class="list">
                {#each options_shown as option}
                    <div
                        role="button" tabindex="0"
                        class="main-list-item flex gap-1"
                        on:click={(e)=>{e.stopPropagation();ToggleSelect(option.value)}}
                        on:keydown={((e)=>{if(e.key == " ") ToggleSelect(option.value)})}
                    >
                        <div class="text-node">{option.text}</div>
                        <div class="selected-node">{option.selected ? "✅" : "❌"}</div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
