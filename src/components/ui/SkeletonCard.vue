<template>
  <div class="skeleton">
    <!-- Shimmer Effect Overlay -->
    <div class="shimmer"></div>
  </div>
</template>

<style scoped>
.skeleton {
  width: 100%;
  aspect-ratio: 2/3;
  border-radius: 20px;
  background-color: rgba(19, 49, 92, 0.6); /* Dunkles Blau als Basis */
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
}

.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateX(-100%);
  
  /* Der magische Gradient für den Glanz-Effekt */
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  
  animation: loading 1.5s infinite;
}

@keyframes loading {
  100% {
    transform: translateX(100%);
  }
}
</style>
