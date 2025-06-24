import { createPluginRegistration } from '@embedpdf/core';
import { EmbedPDF } from '@embedpdf/core/react';
import { usePdfiumEngine } from '@embedpdf/engines/react';
import { ViewportPluginPackage } from '@embedpdf/plugin-viewport';
import { Viewport } from '@embedpdf/plugin-viewport/react';
import { ScrollPluginPackage, ScrollStrategy } from '@embedpdf/plugin-scroll';
import { Scroller } from '@embedpdf/plugin-scroll/react';
import { LoaderPluginPackage } from '@embedpdf/plugin-loader';
import { FilePicker } from '@embedpdf/plugin-loader/react';
import { RenderPluginPackage } from '@embedpdf/plugin-render';
import { RenderLayer } from '@embedpdf/plugin-render/react';
import { TilingPluginPackage } from '@embedpdf/plugin-tiling';
import { TilingLayer } from '@embedpdf/plugin-tiling/react';
import { ZoomMode, ZoomPluginPackage } from '@embedpdf/plugin-zoom';
import { MarqueeZoom } from '@embedpdf/plugin-zoom/react';
import { SearchPluginPackage } from '@embedpdf/plugin-search';
import { SearchLayer } from '@embedpdf/plugin-search/react';
import { InteractionManagerPluginPackage } from '@embedpdf/plugin-interaction-manager';
import {
  GlobalPointerProvider,
  PagePointerProvider,
} from '@embedpdf/plugin-interaction-manager/react';
import { PanPluginPackage } from '@embedpdf/plugin-pan';
import { PanMode } from '@embedpdf/plugin-pan/react';
import { RotatePluginPackage } from '@embedpdf/plugin-rotate';
import { Rotate } from '@embedpdf/plugin-rotate/react';
import { SpreadPluginPackage } from '@embedpdf/plugin-spread';
import { FullscreenPluginPackage } from '@embedpdf/plugin-fullscreen';
import { FullscreenProvider } from '@embedpdf/plugin-fullscreen/react';
import { ExportPluginPackage } from '@embedpdf/plugin-export';
import { Download } from '@embedpdf/plugin-export/react';
import { ThumbnailPluginPackage } from '@embedpdf/plugin-thumbnail';

import { CircularProgress, Box, Alert } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

import { PageControls } from './components/page-controls';
import { Search } from './components/search';
import { Drawer, DrawerComponent, DrawerProvider } from './components/drawer-system';
import { Sidebar } from './components/sidebar';
import { Toolbar } from './components/toolbar';
import { ViewSidebarReverseIcon } from './icons';

console.log('TEST123XASD');
const plugins = [
  createPluginRegistration(LoaderPluginPackage, {
    loadingOptions: {
      type: 'url',
      pdfFile: {
        id: 'pdf',
        url: 'https://snippet.embedpdf.com/ebook.pdf',
      },
      options: {
        mode: 'full-fetch',
      },
    },
  }),
  createPluginRegistration(ViewportPluginPackage, {
    viewportGap: 10,
  }),
  createPluginRegistration(ScrollPluginPackage, {
    strategy: ScrollStrategy.Vertical,
  }),
  createPluginRegistration(RenderPluginPackage),
  createPluginRegistration(TilingPluginPackage, {
    tileSize: 768,
    overlapPx: 2.5,
    extraRings: 0,
  }),
  createPluginRegistration(ZoomPluginPackage, {
    defaultZoomLevel: ZoomMode.FitPage,
  }),
  createPluginRegistration(SearchPluginPackage),
  createPluginRegistration(InteractionManagerPluginPackage),
  createPluginRegistration(PanPluginPackage),
  createPluginRegistration(RotatePluginPackage),
  createPluginRegistration(SpreadPluginPackage),
  createPluginRegistration(FullscreenPluginPackage),
  createPluginRegistration(ExportPluginPackage),
  createPluginRegistration(ThumbnailPluginPackage),
];

const drawerComponents: DrawerComponent[] = [
  {
    id: 'search',
    component: Search,
    icon: SearchOutlinedIcon,
    label: 'Search',
    position: 'right',
  },
  {
    id: 'sidebar',
    component: Sidebar,
    icon: ViewSidebarReverseIcon,
    label: 'Sidebar',
    position: 'left',
  },
];

function App() {
  const { engine, isLoading, error } = usePdfiumEngine({
    wasmUrl: 'https://cdn.jsdelivr.net/npm/@embedpdf/pdfium/dist/pdfium.wasm',
  });

  if (error) {
    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Alert severity="error">Failed to initialize PDF viewer:</Alert>
      </Box>
    );
  }

  if (isLoading || !engine) {
    return (
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <DrawerProvider components={drawerComponents}>
      <EmbedPDF engine={engine} plugins={plugins}>
        {({ pluginsReady }) => (
          <FullscreenProvider>
            <Box
              sx={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                userSelect: 'none',
              }}
            >
              <Toolbar />

              {/* Main content area with sidebars */}
              <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Left Sidebar */}
                <Drawer position="left" />

                {/* Main Viewport */}
                <Box
                  sx={{
                    flex: '1 1 0', // grow / shrink, flex-basis 0
                    minWidth: 0, // allow shrinking inside flex row
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <GlobalPointerProvider>
                    <PanMode />
                    <Viewport
                      style={{
                        width: '100%',
                        height: '100%',
                        flexGrow: 1,
                        backgroundColor: '#f1f3f5',
                        overflow: 'auto',
                      }}
                    >
                      {!pluginsReady && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            width: '100%',
                          }}
                        >
                          <CircularProgress size={48} />
                        </Box>
                      )}
                      {pluginsReady && (
                        <Scroller
                          renderPage={({
                            document,
                            width,
                            height,
                            pageIndex,
                            scale,
                            rotatedHeight,
                            rotatedWidth,
                            rotation,
                          }) => (
                            <Rotate pageSize={{ width, height }}>
                              <Box
                                key={document?.id}
                                sx={{
                                  width,
                                  height,
                                  position: 'relative',
                                  backgroundColor: 'white',
                                }}
                              >
                                <RenderLayer pageIndex={pageIndex} />
                                <TilingLayer pageIndex={pageIndex} scale={scale} />
                                <SearchLayer pageIndex={pageIndex} scale={scale} />
                                <PagePointerProvider
                                  pageIndex={pageIndex}
                                  pageWidth={rotatedWidth}
                                  pageHeight={rotatedHeight}
                                  rotation={rotation}
                                  scale={scale}
                                >
                                  <MarqueeZoom
                                    pageIndex={pageIndex}
                                    scale={scale}
                                    pageWidth={width}
                                    pageHeight={height}
                                  />
                                </PagePointerProvider>
                              </Box>
                            </Rotate>
                          )}
                        />
                      )}
                      <PageControls />
                    </Viewport>
                  </GlobalPointerProvider>
                </Box>

                {/* Right Sidebar */}
                <Drawer position="right" />
              </Box>
            </Box>
            <Download />
            <FilePicker />
          </FullscreenProvider>
        )}
      </EmbedPDF>
    </DrawerProvider>
  );
}

export default App;
