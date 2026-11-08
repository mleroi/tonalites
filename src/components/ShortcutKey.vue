<script setup>
// The keyboard shortcut of a setting, shown discreetly right after its text.
// The key itself goes in the default slot ("G", "F5", "Ctrl + P"…).
</script>

<template>
  <kbd
    class="ml-1.5 rounded border border-neutral-200 bg-neutral-50 px-1 py-px align-middle font-sans text-[10px] font-normal leading-none tracking-normal text-neutral-400"
    ><slot
  /></kbd>
</template>
