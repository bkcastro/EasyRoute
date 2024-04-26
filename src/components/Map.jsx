import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';
import * as geolib from 'geolib';

/* 
   Credits
   
   The logic used to extract osm data and display them with three.js is by Jeff Wu thank you good sure. 
   Here is the link to the code: https://jsfiddle.net/jeffwu00/z0tLx7sj/2/
*/

var MAT_BUILDING
const center = [36.99283, -122.05855]

function Map() {
    const [count, setCount] = useState(0);
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

        // Grid helper 
        scene.add(new THREE.GridHelper(50, 50));

        // Map Controls 
        const controls = new MapControls(camera, renderer.domElement);
        controls.enableDamping = true
        controls.dampingFactor = .25
        controls.screenSpacePanning = true
        controls.maxDistance = 1000
        controls.maxZoom = 50

        // Init Light
        let light0 = new THREE.AmbientLight(0xfafafa, 10.25)

        let light1 = new THREE.PointLight(0xfafafa, 0.4)
        light1.position.set(20, 30, 10)

        let light2 = new THREE.PointLight(0xfafafa, 0.4)
        light2.position.set(20, 30, -10)

        scene.add(light0)
        scene.add(light1)
        scene.add(light2)

        // Init Group
        const iR = new THREE.Group()
        iR.name = "interactive Root"
        scene.add(iR)

        MAT_BUILDING = new THREE.MeshPhongMaterial({ color: "white" })

        GetGeoJson()

        // Animation loop
        const animate = function () {
            requestAnimationFrame(animate);

            controls.update()
            // Render the scene
            renderer.render(scene, camera);
        };

        animate();

        function GetGeoJson() {
            fetch('/ucsc.geojson')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then((data) => {
                    LoadBuildings(data);
                })
                .catch((error) => {
                    console.error('There was a problem with your fetch operation:', error);
                });
        }


        function LoadBuildings(data) {

            let features = data.features

            for (let i = 0; i < 200; i++) {

                let fel = features[i]
                if (!fel['properties']) return

                if (fel.properties['building']) {
                    addBuilding(fel.geometry.coordinates)
                }
            }
        }

        function addBuilding(data, height = 1) {

            height = height ? height : 1

            let shape = genShape(data[0])

            const extrudeSettings = {
                steps: 1,
                depth: 10,
                bevelEnabled: false,
                bevelThickness: 0,
                bevelSize: 0,
                bevelOffset: 0,
                bevelSegments: 0
            };

            let geometry = genGeometry(shape, extrudeSettings);

            // geometry.rotateX(Math.PI / 2)
            // geometry.rotateZ(Math.PI)

            const mesh = new THREE.Mesh(geometry, MAT_BUILDING)
            //console.log(mesh.position);
            scene.add(mesh)
        }

        function genShape(points) {
            let shape = new THREE.Shape()

            for (let i = 0; i < points.length; i++) {
                let elp = points[i]
                elp = GPSRelativePosition(elp)

                if (i == 0) {
                    shape.moveTo(elp[0], elp[1])
                } else {
                    shape.lineTo(elp[0], elp[1])
                }
            }

            console.log(shape.curves);

            return shape
        }

        function genGeometry(shape, settings) {
            let geometry = new THREE.ExtrudeGeometry(shape, settings)
            geometry.computeBoundingBox()

            return geometry
        }


        function GPSRelativePosition(objPosi) {

            // Get GPS distance
            let dis = geolib.getDistance(objPosi, center)

            var start_latitude = center[0]
            var start_longitude = center[1]
            var stop_latitude = objPosi[0]
            var stop_longitude = objPosi[1]

            // Equation to calculate the bearing between the two points. 
            var a = Math.sin(stop_longitude - start_longitude) * Math.cos(stop_latitude);
            var b = Math.cos(start_latitude) * Math.sin(stop_latitude) - Math.sin(start_latitude) * Math.cos(stop_latitude) * Math.cos(stop_longitude - start_longitude);
            var bearing = Math.atan2(a, b) * 180 / Math.PI;

            // Calculate X by centerPosi.x + distance * cos(rad)
            let x = center[0] + (dis * Math.cos(bearing * Math.PI / 180))

            // Calculate Y by centerPosi.y + distance * sin(rad)
            let y = center[1] + (dis * Math.sin(bearing * Math.PI / 180))

            // Reverse X (it work) 
            return [-x / 100, (y / 100)]
        }

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
