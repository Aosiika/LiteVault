import { SchematicRenderer } from 'schematic-renderer';

let currentRenderer = null;

window.initSchemViewer = async function(canvasId, containerId, payload) {
    const canvas = document.getElementById(canvasId);
    const container = document.getElementById(containerId);

    if (!canvas || !container) {
        requestAnimationFrame(() => window.initSchemViewer(canvasId, containerId, payload));
        return;
    }

    if (currentRenderer) {
        window.disposeSchemViewer();
    }

    const { id } = payload;
    const litematicUrl = `/api/schematics/${id}/file`;
    const packUrl = `/viewer3d/pack.zip`; // We must ensure pack.zip is copied here

    currentRenderer = new SchematicRenderer(
        canvas,
        {
            [id]: async () => {
                console.log(`[SchemViewer] Fetching schematic data for ${id}`);
                const response = await fetch(litematicUrl);
                if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);
                return await response.arrayBuffer();
            }
        },
        {
            "default": async () => {
                console.log(`[SchemViewer] Fetching resource pack`);
                const response = await fetch(packUrl);
                if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);
                return await response.blob();
            }
        },
        {
            renderSettings: {
                antialias: false, // Can enable later if performance allows
            }
        }
    );

    currentRenderer.setBackgroundColor('#0a0c12');
    
    // Resize observer to handle dynamic window resizing
    const resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth && container.clientHeight) {
            currentRenderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    resizeObserver.observe(container);
    currentRenderer._litevaultResizeObserver = resizeObserver;

    try {
        await currentRenderer.renderSchematic(id);
        console.log(`[SchemViewer] Schematic rendered successfully`);
    } catch (err) {
        console.error(`[SchemViewer] Failed to render schematic:`, err);
    }
};

window.setSchemLayerSlice = function(yMin, yMax) {
    if (currentRenderer && currentRenderer.renderedSchematics.size > 0) {
        const id = Array.from(currentRenderer.renderedSchematics.keys())[0];
        // Note: SchematicRenderer bound coordinates are in schematic local space
        currentRenderer.setRenderingBounds(
            id,
            [-1000, yMin, -1000],
            [1000, yMax, 1000],
            false
        );
    }
};

window.resetSchemCamera = function() {
    if (currentRenderer) {
        const id = Array.from(currentRenderer.renderedSchematics.keys())[0];
        if (id) {
            currentRenderer.centerCameraOnSchematic(id);
        }
    }
};

window.toggleSchemAutoRotate = function() {
    if (currentRenderer && currentRenderer.controls) {
        currentRenderer.controls.autoRotate = !currentRenderer.controls.autoRotate;
        return currentRenderer.controls.autoRotate;
    }
    return false;
};

window.disposeSchemViewer = function() {
    if (currentRenderer) {
        if (currentRenderer._litevaultResizeObserver) {
            currentRenderer._litevaultResizeObserver.disconnect();
        }
        try {
            currentRenderer.destroy();
        } catch(e) {
            console.error("Error disposing renderer:", e);
        }
        currentRenderer = null;
    }
};
