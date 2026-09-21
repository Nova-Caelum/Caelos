export interface LoaderController {
  render(seconds: number): void;
  play(): void;
  pause(): void;
  destroy(): void;
  readonly time: number;
}
export function mount(host: HTMLElement, options?: { autoplay?: boolean }): LoaderController;
