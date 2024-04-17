import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';
import * as geolib from 'geolib';

var MAT_BUILDING
const center = [-3.188822, 55.943686] //[36.99283, -122.05855]

const api = "https://gistcdn.githack.com/isjeffcom/a611e99aa888534f67cc2f6273a8d594/raw/9dbb086197c344c860217826c59d8a70d33dcb54/gistfile1.txt"

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
        controls.screenSpacePanning = false
        controls.maxDistance = 20
        controls.maxZoom = 50

        // Init Light
        let light0 = new THREE.AmbientLight(0xfafafa, 0.25)

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
            fetch(api)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("hi")
                    LoadBuildings(data);
                })
                .catch((error) => {
                    console.error('There was a problem with your fetch operation:', error);
                });
        }


        function LoadBuildings(data) {

            let features = data.features

            for (let i = 0; i < features.length; i++) {
                console.log(features[i])

                let fel = features[i]
                if (!fel['properties']) return

                if (fel.properties['building']) {
                    addBuilding(fel.geometry.coordinates, fel.properties, fel.properties["building:levels"])
                }
            }
        }

        function addBuilding(data, info, height = 1) {

            console.log("data", data)

            height = height ? height : 1

            for (let i = 0; i < data.length; i++) {
                let el = data[i]

                let shape = genShape(el, center)
                let geometry = genGeometry(shape, {
                    curveSegments: 1,
                    depth: 0.05 * height,
                    bevelEnabled: false
                })

                geometry.rotateX(Math.PI / 2)
                geometry.rotateZ(Math.PI)

                let mesh = new THREE.Mesh(geometry, MAT_BUILDING)
                scene.add(mesh)
            }


        }

        function genShape(points, center) {
            let shape = new THREE.Shape()

            for (let i = 0; i < points.length; i++) {
                let elp = points[i]
                elp = GPSRelativePosition(elp, center)

                if (i == 0) {
                    shape.moveTo(elp[0], elp[1])
                } else {
                    shape.lineTo(elp[0], elp[1])
                }
            }

            return shape
        }

        function genGeometry(shape, settings) {
            let geometry = new THREE.ExtrudeGeometry(shape, settings);
            geometry.computeBoundingBox()

            return geometry
        }

        function GPSRelativePosition(objPosi, centerPosi) {

            // Get GPS distance
            let dis = geolib.getDistance(objPosi, centerPosi)

            // Get bearing angle
            let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)

            // Calculate X by centerPosi.x + distance * cos(rad)
            let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))

            // Calculate Y by centerPosi.y + distance * sin(rad)
            let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))

            // Reverse X (it work) 
            return [-x / 100, y / 100]
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
