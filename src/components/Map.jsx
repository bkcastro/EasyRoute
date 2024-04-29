import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';
import * as geolib from 'geolib';

/* 
   Credits
   
   The logic used to extract osm data and display them with three.js is by Jeff Wu thank you good sure. 
   Here is the link to the code: https://jsfiddle.net/jeffwu00/z0tLx7sj/2/
*/

var MAT_BUILDING
const center = [36.9916,-122.0583]

function calcualateCentroid(coords) {
    // Calculate centroid
    let centroidX = 0, centroidY = 0;
    coords.forEach(coord => {
        centroidX += coord[0];
        centroidY += coord[1];
    });
    centroidX /= coords.length;
    centroidY /= coords.length;

    console.log("Centroid:", centroidX, centroidY);
    return [centroidX, centroidY]
}

function Map() {
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
            fetch('/UCSC_Buildings.geojson')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log("Buildings Starting.");
                    LoadBuildings(data);
                    console.log("Buildings loaded.", scene);
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
        addBuilding(fel.geometry.coordinates, fel.properties, fel.properties["building:levels"])
      }
    }
  }
  
  function addBuilding(data, info, height = 1) {
  
    height = height ? height : 1
  
    for (let i = 0; i < data.length; i++) {
      let el = data[i]
  
      let shape = genShape(el)
      let geometry = genGeometry(shape, {
        curveSegments: 1,
        depth: 0.5 * height,
        bevelEnabled: false
      })
  
      geometry.rotateX(Math.PI / 2)
      geometry.rotateZ(Math.PI)
  
      let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: Math.random()*0x1da12a}))
      mesh.name = "building"
      //console.log(mesh.position, mesh.geometry.attributes);
      scene.add(mesh)
    }
  }
  
  function genShape(points) {
    let shape = new THREE.Shape()

    let center = calcualateCentroid(points);
  
    for (let i = 0; i < points.length; i++) {
        let elp = points[i]
        const x = (elp[0] - center[0]) * 50000; // Scaling factor for longitude
        const y = (elp[1] - center[1]) * 50000; // Scaling factor for latitude
        console.log(x, y)
  
      if (i == 0) {
        shape.moveTo(x, y)
      } else {
        shape.lineTo(x, y)
      }
    }
  
    return shape
  }
  
  function genGeometry(shape, settings) {
    let geometry = new THREE.ExtrudeGeometry(shape, settings)
    //geometry.computeBoundingBox()
    return geometry
  }

  function GPSRelativePosition(objPosi, centerPosi) {
      // Ensure that positions are in the correct format for geolib
      const formattedObjPosi = { latitude: objPosi[1], longitude: objPosi[0] };
      const formattedCenterPosi = { latitude: centerPosi[1], longitude: centerPosi[0] };
  
      // Get GPS distance in meters
      let dis = geolib.getDistance(formattedObjPosi, formattedCenterPosi);
      //console.log("dis", dis);
  
      // Get bearing angle in degrees
      let bearing = geolib.getGreatCircleBearing(formattedObjPosi, formattedCenterPosi);
     //console.log("bearing", bearing);
  
      // Calculate X by adding to the center's longitude the east/west distance offset
      // Convert distance from meters to degrees approximately (not precise, depends on latitude)
      let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180) / 111320);
  
      // Calculate Y by adding to the center's latitude the north/south distance offset
      // Convert distance from meters to degrees
      let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180) / 110540);
  
      // Reverse X and scale (adjust the scaling factor according to your needs)
      return [-x, y];
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
