import { h, render } from 'preact';
import { PDFViewer, PDFViewerConfig } from '@/components/app';
import { PluginRegistry } from '@embedpdf/core';
import { PAN_PLUGIN_ID, PanPlugin } from '@embedpdf/plugin-pan';
import { SearchPlugin } from '@embedpdf/plugin-search';
import { UIPlugin } from '@embedpdf/plugin-ui';
import {
  ZOOM_PLUGIN_ID,
  ZoomPlugin,
  ZoomLevel,
  ZoomMode,
} from '@embedpdf/plugin-zoom';
export class EmbedPdfContainer extends HTMLElement {
  private root: ShadowRoot;
  private _config!: PDFViewerConfig;
  private _registry?: PluginRegistry;
  private _search?: string;
  private _pendingPan?: boolean;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    console.info('HEY THATS NICE');
  }

  // ← new JS property API
  get config() { return this._config; }
  set config(cfg: PDFViewerConfig & {
    search?: string;
    panning?: boolean;
    zoomLevel?: ZoomLevel;
  }) {
    // 1) core PDF config
    this._config = { zoomLevel: cfg?.zoomLevel, src: cfg.src, worker: cfg.worker, wasmUrl: cfg.wasmUrl };

    // 2) queue the extras
    this._search = cfg.search ?? '';
    this._pendingPan = cfg.panning ?? false;
    this._zoomLevel = cfg.zoomLevel;

    // 3) render (will fire onInitialized → handleInit)
    this.renderViewer();
  }


  get src() { return this._config.src; }
  set src(v: string) { this.setAttribute('src', v); }

  get search() { return this._search ?? ''; }



  get panning() { return !!this._pendingPan; }
  set panning(v: boolean) {
    this._pendingPan = v;
    console.log('[EmbedPdfContainer] panning setter called, value=', v);
    console.log('[EmbedPdfContainer] registry is', this._registry);

    const panCap = this._registry
      ?.getPlugin<PanPlugin>(PAN_PLUGIN_ID)
      ?.provides();

    console.log('[EmbedPdfContainer] panCap =', panCap);

    if (panCap) {
      if (v) {
        console.log('[EmbedPdfContainer] enabling pan');
        panCap.enablePan();
      } else {
        console.log('[EmbedPdfContainer] disabling pan');
        panCap.disablePan();
      }
      return;
    }

    console.warn('[EmbedPdfContainer] no PanPlugin found in registry');
  }
  static get observedAttributes() {
    return ['src', 'worker', 'search', 'panning', 'zoom-level'];
  }

  attributeChangedCallback(name: string, _old: any, value: string | null) {
    console.log('[EmbedPdfContainer] attributeChangedCallback', name, '→', value);
    switch (name) {
      case 'src':
        this._config.src = value ?? this._config.src;
        this.renderViewer();
        break;
      case 'worker':
        this._config.worker = value !== 'false';
        this.renderViewer();
        break;
      case 'search':
        this.search = value || '';
        break;
      case 'panning':
        this.panning = value !== 'false';
        break;
      case 'zoom-level':
        const lvl = parseFloat(value || '');
        if (!isNaN(lvl)) this.zoomLevel = lvl;
        break;
    }
  }



  set search(q: string) {
    this._search = q;
    this.performSearch()
  }

  private async performSearch() {
    if (!this._registry) return;

    const ui = this._registry.getPlugin<UIPlugin>('ui')?.provides();
    const search = this._registry.getPlugin<SearchPlugin>('search')?.provides();
    if (!ui || !search) return;

    // open/close the rightPanel as before…
    ui.updateComponentState({
      componentType: 'panel',
      componentId: 'rightPanel',
      patch: { open: !!this._search, visibleChild: 'search' }
    });
    if (this._search) {
      const searches = await search.searchAllPages(this._search);

      console.log('SEARCH RESULTS', searches)
      // once results arrive, go to the first one
      // the search plugin emits a “search-complete” event you can hook:
      if (searches.results.length) {
        setTimeout(() => {
          search.goToResult(0);
          console.error('MOVE SEARCH RES')
        }, 3000)
      }
      // als notify clients if you like:
      document.dispatchEvent(new CustomEvent('pdf-search-complete', {
        detail: { query: this._search, total: searches.results.length }
      }));
    } else {
      search.stopSearch?.();
    }
  }


  connectedCallback() {
    if (!this._config) {
      this._config = {
        src: this.getAttribute('src') ?? '/demo.pdf',
        worker: this.getAttribute('worker') !== 'false',
      };
    }
    this.renderViewer();
  } 
  
  private handleInit = (r: PluginRegistry) => {
    this._registry = r;
    console.log('[EmbedPdfContainer] onInitialized; plugin IDs=', r.getAllPlugins());

    if (this._pendingPan !== undefined) {
      console.log('[EmbedPdfContainer] replaying pan=', this._pendingPan);
      this.panning = this._pendingPan;
    }
    if (this._zoomLevel !== undefined) {
      console.log('[EmbedPdfContainer] replaying zoomLevel=', this._zoomLevel);
      this.zoomLevel = this._zoomLevel;  // ← always go through setter
    }
    if (this._search) {
      console.log('[EmbedPdfContainer] replaying search=', this._search);
      this.performSearch();
    }
  };

  // 2) Robust applyZoom: double-check ID
  private applyZoom(level: ZoomLevel) {
    const id = ZOOM_PLUGIN_ID ?? 'zoom';
    console.log('[EmbedPdfContainer] applyZoom →', level, 'using plugin ID', id);
    const zoomCap = this._registry
      ?.getPlugin<ZoomPlugin>(id)
      ?.provides();
    console.log('[EmbedPdfContainer] zoomCap =', zoomCap);
    if (zoomCap) {
      zoomCap.requestZoom(level);
      console.log('[EmbedPdfContainer] requested zoom', level);
    } else {
      console.warn('[EmbedPdfContainer] Zoom plugin not found; will replay on init');
    }
  }


  private renderViewer() {
    render(
      <PDFViewer
        key={this._config.src}
        config={this._config}
        onInitialized={this.handleInit}
      />,
      this.root,
    );
  }
  private _zoomLevel?: ZoomLevel;

  get zoomLevel(): ZoomLevel {
    // default to FitPage (for example) if nothing set
    return this._zoomLevel ?? ZoomMode.FitPage;
  }
  set zoomLevel(v: ZoomLevel) {
    this._zoomLevel = v;
    console.log('[EmbedPdfContainer] zoomLevel →', v);
    this.applyZoom(v);
  }
}
