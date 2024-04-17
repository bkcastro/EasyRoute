import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';

function Map() {
    const [count, setCount] = useState(0);
    const mountRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Geometry and material
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Position the camera
        camera.position.y = 10;
        camera.position.x = 20;

        // Grid helper 
        scene.add(new THREE.GridHelper(50, 50));

        // Map Controls 
        const controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true
        controls.dampingFactor = .25
        controls.screenSpacePanning = false
        controls.maxDistance = 60

        // Init Group
        const iR = new THREE.Group()
        iR.name = "interactive Root"
        scene.add(iR)

        // Animation loop
        const animate = function () {
            requestAnimationFrame(animate);

            // Rotate cube
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            // Update controls 
            controls.update()

            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup function
        return () => {
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div ref={mountRef} style={{ width: '1200px', height: '1000px' }} />
    );
}

export default Map;
