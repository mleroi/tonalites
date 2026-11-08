<script setup>
// The keyboard shortcuts and mouse actions reference: one titled list of
// keys and actions per section, laid out side by side on wide screens.
defineProps({
  // [{ title, items: [[keys, action], …] }, …]
  sections: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="grid grid-cols-1 items-start gap-x-10 gap-y-6 md:grid-cols-2">
    <div v-for="section in sections" :key="section.title" class="flex flex-col gap-3">
      <span class="text-sm font-medium tracking-wide text-neutral-600">
        {{ section.title }}
      </span>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm text-neutral-500">
        <template v-for="[keys, action] in section.items" :key="keys">
          <dt>
            <kbd
              class="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-sans text-xs text-neutral-600"
              >{{ keys }}</kbd
            >
          </dt>
          <dd>{{ action }}</dd>
        </template>
      </dl>
    </div>
  </div>
</template>
