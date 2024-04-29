import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';

function MapTest() {
    const mountRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            antialias: true
        })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Position the camera
        camera.position.y = 10;
        camera.position.x = 20;

        let gridHelper = new THREE.GridHelper(60, 160, new THREE.Color(0x555555), new THREE.Color(0x333333))
        scene.add(gridHelper)

        // Map Controls 
        const controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true
        controls.dampingFactor = .25
        controls.screenSpacePanning = true
        controls.maxDistance = 1000

        // Init Light
        let light0 = new THREE.AmbientLight(0xfafafa, 10.25)

        let light1 = new THREE.PointLight(0xfafafa, 0.4)
        light1.position.set(20, 30, 10)

        scene.add(light0)
        scene.add(light1)

        
        // Animation loop
        const animate = function () {
            requestAnimationFrame(animate);

            controls.update()
            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

function calculateCentroid(features) {
    let centroidX = 0, centroidY = 0, count = 0;
    features.forEach(feature => {
        feature.geometry.coordinates.forEach(polygon => {
            polygon[0].forEach(([lng, lat]) => { // assuming each feature is a polygon
                centroidX += lng;
                centroidY += lat;
                count++;
            });
        });
    });
    return [centroidX / count, centroidY / count]; // average
}

function translateCoordinates(features, center) {
    const [centerLng, centerLat] = center;
    return features.map(feature => {
        const newCoords = feature.geometry.coordinates.map(polygon => {
            return polygon.map(points => points.map(([lng, lat]) => {
                return [
                    (lng - centerLng) * 100000, // scale factor for visualization
                    (lat - centerLat) * 100000  // scale factor for visualization
                ];
            }));
        });
        return { ...feature, geometry: { ...feature.geometry, coordinates: newCoords }};
    });
}

async function loadAndCenterGeoJSON(url) {
    const response = await fetch(url);
    const geojsonData = await response.json();

    const center = calculateCentroid(geojsonData.features);
    const centeredFeatures = translateCoordinates(geojsonData.features, center);

    const material = new THREE.MeshLambertMaterial({ color: 0x808080, wireframe: false });

    centeredFeatures.forEach(feature => {
        feature.geometry.coordinates.forEach(polygon => {
            const shape = new THREE.Shape();
            polygon[0].forEach(([x, y], index) => {
                if (index === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            });

            const extrudeSettings = {
                steps: 1,
                depth: 10, // Building height
                bevelEnabled: false
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
        });
    });
}
        
loadAndCenterGeoJSON('/UCSC_Buildings.geojson');  // Specify the path to your GeoJSON
        

     
        // Cleanup function
        return () => {
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div ref={mountRef} style={{ width: '1200px', height: '1000px' }} />
    );
}

export default MapTest;
