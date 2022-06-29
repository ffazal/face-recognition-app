import React, { Component } from 'react';
import Logo from './components/Logo/Logo';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import Clarifai from 'clarifai';
import Rank from './components/Rank/Rank';
import Register from './components/Register/Register';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import './App.css';

const app = new Clarifai.App({
  apiKey: '36dac27f2bf04a1f9d86d6b4c19f69b4'
 });

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true
      }
    },
    links: {
      distance: 150,
      enable: true,
    },
    move: {
      enable: true,
      speed: 5,
    },
  },
}

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  //On Image submit
  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    app.models
      .predict(
        Clarifai.FACE_DETECT_MODEL, 
        this.state.input)
      .then(response => {
        console.log('hi', response)
        if (response) {
          fetch('http://localhost:3000/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
          .then(response => response.json())
          .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }))
          })
        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state; // Destructuring so we can remove "this.state"

    const particlesInit = async (main) => {
      console.log(main);
  
      await loadFull(main);
    };
  
    const particlesLoaded = (container) => {
      console.log(container);
    };

  return (
    <div className="App">
      <Particles className='particles'
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particlesOptions}
      />

      <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
      { route === 'home' // If state equal to home
        // Then render:
         ? <div> 
              <Logo /> 
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              <ImageLinkForm 
                onInputChange={this.onInputChange} 
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition box={box} imageUrl={imageUrl}/>
            </div>
        // Otherwise
        : (
          route === 'signin' //if state is signin
          // Then render
          ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>  
          // Otherwise render: 
          : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
        )
         
        // Otherwise load rest of the components
        
      }
    </div>
  );

}
}

export default App;
