/** Soft-float 古风飞天 PNG stage (default skin). */
export async function createGuofengStage(
  host: HTMLElement,
  src: string,
): Promise<() => void> {
  const img = document.createElement("img");
  img.className = "pet";
  img.alt = "Apsara 飞天";
  img.draggable = false;
  img.src = src;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.background = "transparent";
  img.style.border = "0";
  img.style.outline = "none";
  img.style.animation = "apsara-float 4.5s ease-in-out infinite";
  host.appendChild(img);

  if (!document.getElementById("apsara-float-style")) {
    const style = document.createElement("style");
    style.id = "apsara-float-style";
    style.textContent = `
@keyframes apsara-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}`;
    document.head.appendChild(style);
  }

  return () => {
    img.remove();
  };
}
