<script setup lang="ts"></script>

<template>
  <!-- фиксируем баннер сверху и поднимаем слой -->
  <div class="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white">
    <div class="overflow-hidden whitespace-nowrap py-1">
      <div class="flex animate-marquee will-change-transform">
        <p class="text-2xl font-bold mr-8">
          АААААААААААВИАСЕЙЛС, ВСЕМ ВНИМАНИЕ!!! По промокоду
          <b>ANIMEGIRL</b> скидка 20% при покупке билета!
        </p>
        <!-- дублируем для бесшовной прокрутки -->
        <p class="text-2xl font-bold mr-8">
          АААААААААААВИАСЕЙЛС, ВСЕМ ВНИМАНИЕ!!! По промокоду
          <b>ANIMEGIRL</b> скидка 20% при покупке билета!
        </p>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes marquee {
  0%   { transform: translate3d(0%, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}
.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 12s linear infinite;
}
</style>
