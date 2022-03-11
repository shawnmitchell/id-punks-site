import React, {useState, useEffect} from 'react';
import { FormControl, FormControlLabel, FormLabel, RadioGroup, Radio } from '@material-ui/core';
import mergeImages from 'merge-images';
import {ethers} from 'ethers';
import './App.css';
import { API } from 'aws-amplify';
import RealIDPunks from './contracts/RealIDPunks.json';
import { WebcamCapture } from './components/webcam';

const CONTRACT_ADDRESS = "0xF2Ec1cF88e39a37eBd40250D33a024f98d760fEf";

interface Proof {
  index: number;
  key: string;
  value: string;
  proof: string[];
}

interface ColorChipProps {
  color: string;
}

const ColorChip = ({color}: ColorChipProps) => {
  return (
    <div style={{height: 24, width: 24, borderRadius: 12, backgroundColor: color}} />
  )
}

function App() {
  const [img, setImg] = useState<string>();
  const [background, setBackground] = useState<string>('./assets/backgrounds/blue.png');
  const [eyes, setEyes] = useState<string>('./assets/eyes/blue.png');
  const [hairLength, setHairLength] = useState<'short' | 'long'>('short');
  const [hairColor, setHairColor] = useState<string>('bald');
  const [sweatband, setSweatband] = useState<'none' | 'Blue' | 'Green' | 'Red'>('none');
  const [skintone, setSkintone] = useState<string>('./assets/skintones/brown.png');
  const [mouth, setMouth] = useState<string>('./assets/mouths/stoic.png');
  const [jewelry, setJewelry] = useState<string>('./assets/hair/short/bald.png');
  const [accessory, setAccessory] = useState<string>('./assets/hair/short/bald.png');
  const [facialHair, setFacialHair] = useState<string>('./assets/hair/short/bald.png');
  const [selfie, setSelfie] = useState<string>();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [fetching, setFetching] = useState<boolean>(false);

  useEffect(() => {
    
    (async() => {
      // @ts-ignore
      const {ethereum} = window;
      if (!!ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const _signer = provider.getSigner();
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        setWalletAddress(accounts[0]);
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);
        const punks = new ethers.Contract(CONTRACT_ADDRESS, RealIDPunks.abi, _signer);
        // const result = await punks.
        punks.on('Transfer', (event) => {
          console.log(event);
        })

        return () => punks.off('Transfer', () => {});
      }
      

    })();
  }, []);

  useEffect(() => {
    (async () => {
      console.log(window.location.href);
      console.log(sweatband);
      console.log(hairLength);
      const hair = `./assets/hair/${hairLength}/${hairColor}.png`;
      const headband = sweatband === 'none' ? './assets/hair/short/bald.png' : `./assets/hats/${hairLength === 'long' && hairColor !== 'bald' ? 'LongHair' : ''}${sweatband}Sweatband.png`;
      console.log(headband);
      try {
        // ORDER MATTERS HERE - from back to front please
        const result = await mergeImages([
          background, 
          './assets/outline.png', 
          skintone, 
          mouth, 
          './assets/nose.png', 
          eyes, 
          hair,
          facialHair,
          headband,
          jewelry,
          accessory,
        ]);
        setImg(result);
        console.log(result);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [background, eyes, skintone, mouth, jewelry, accessory, facialHair, hairLength, hairColor, sweatband])

  const takeSelfie = () => {
    setShowCamera(true);
  }

  const handleCapture = (imgSrc: string) => {
    setSelfie(imgSrc);
    setShowCamera(false);
  }

  const submit = async () => {
    const result = await API.post('mintPunk', '/', {
      body: {
        address: walletAddress,
        proofs: [],
        selfie: selfie?.split(',')[1]
        }
    })
    console.log(result.result.attributes);
  }

  const handlePaste = async () => {
    try {
      const payload = await navigator.clipboard.readText();
      const parsed = JSON.parse(payload);
      console.log(parsed);
      const gender = parsed.find((item: Proof) => item.key === 'Sex');
      setHairLength(gender.value === 'M' ? 'short' : 'long');
      parsed.forEach((p: Proof) => {
        const {key, value, index, proof} = p;

        switch (key) {
          case 'EyeColor':
            setEyes(`./assets/eyes/${value.toLowerCase()}.png`);
            break;
          case 'HairColor':
            setHairColor(value.toLowerCase());
            break;
          case 'GeographicOrigin': 
            switch (value) {
              case 'EUROPEAN':
                setSkintone('./assets/skintones/pink.png');
                break;
                case 'EASTASIAN':
                  setSkintone('./assets/skintones/asian.png');
                  break;
                case 'SOUTHASIAN':
                  setSkintone('./assets/skintones/tan.png');
                  break;
                case 'AFRICAN':
                  setSkintone('./assets/skintones/brown.png');
                  break;
                default:
                  break;
              }
            break;
          case 'Emotion':
            switch(value) {
              case 'JOY':
                setMouth(gender.value === 'M' ? './assets/mouths/happy.png' : './assets/mouths/SmirkLipstickMouth.png');
                break;
              case 'Sadness':
                setMouth(gender.value === 'M' ? './assets/mouths/mad.png' : './assets/mouths/BoredLipstickMouth.png');
                break;
              default:
                setMouth(gender.value === 'M' ? './assets/mouths/stoic.png' : './assets/mouths/NormalLipstickMouth.png')
                break;
            }
            break;
          case 'FacialHair': 
            setFacialHair(value === '0' ? './assets/hair/short/bald.png' : './assets/beard.png')
            break;
          default:
            console.log(key, value);
            break;
        }
      })
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <div className="SelfieGroup">
        { showCamera ? (<WebcamCapture onCapture={handleCapture} />) : (
        <>
          {!!selfie ? (
          <>  
            <img src={selfie} alt='none' className="Selfie" />
            <button onClick={submit}>Submit</button>
            <button onClick={takeSelfie}>Retake Selfie</button>
          </>
          ) : (
            <button onClick={takeSelfie}>Take Selfie</button>
          )}
        </>
        ) }
        {!!fetching ? (
          <button onClick={handlePaste}>Paste Data Here</button>
        ) : (
          <a href='https://master.d1pxugyx19c9zm.amplifyapp.com/?request=[FacialHair,GeographicOrigin,Sex,Emotion,EyeColor,HairColor]' target="_blank" rel="noreferrer noopener">
            <button onClick={() => setFetching(true)}>Share Eye & Hair Color</button>
          </a> 
        )}
      </div>
      {!!img && (
        <img alt='oops' src={img} height='400px' style={{margin: '4px'}} />
      )}
      <div>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Skin Tone</FormLabel>
        <RadioGroup aria-label="skin tone" name="skintone" value={skintone} onChange={(_, val) => setSkintone(val)}>
          <FormControlLabel value='./assets/skintones/pink.png' control={<Radio />} label={<ColorChip color='#FFCDD2' />} />
          <FormControlLabel value='./assets/skintones/asian.png' control={<Radio />} label={<ColorChip color='#E3CAB1' />} />
          <FormControlLabel value='./assets/skintones/tan.png' control={<Radio />} label={<ColorChip color='#CFA890' />} />
          <FormControlLabel value='./assets/skintones/brown.png' control={<Radio />} label={<ColorChip color='#5C4036' />} />
          <FormControlLabel value='./assets/skintones/alien.png' control={<Radio />} label={<ColorChip color='#F0BBFA' />} />
          <FormControlLabel value='./assets/skintones/zombie.png' control={<Radio />} label={<ColorChip color='#FC6868' />} />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Background</FormLabel>
        <RadioGroup aria-label="background" name="background" value={background} onChange={(_, val) => setBackground(val)}>
          <FormControlLabel value='./assets/backgrounds/blue-sky.png' control={<Radio />} label="BlueSky" />
          <FormControlLabel value='./assets/backgrounds/gray.png' control={<Radio />} label="Gray" />
          <FormControlLabel value='./assets/backgrounds/green.png' control={<Radio />} label="Green" />
          <FormControlLabel value='./assets/backgrounds/blue.png' control={<Radio />} label="Blue" />
          <FormControlLabel value='./assets/backgrounds/orange.png' control={<Radio />} label="Orange" />
          <FormControlLabel value='./assets/backgrounds/pink.png' control={<Radio />} label="Pink" />
          <FormControlLabel value='./assets/backgrounds/purple.png' control={<Radio />} label="Purple" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Eye Color</FormLabel>
        <RadioGroup aria-label="eye color" name="skintone" value={eyes} onChange={(_, val) => setEyes(val)}>
          <FormControlLabel value='./assets/eyes/blue.png' control={<Radio />} label="Blue" />
          <FormControlLabel value='./assets/eyes/gray.png' control={<Radio />} label="Gray" />
          <FormControlLabel value='./assets/eyes/brown.png' control={<Radio />} label="Brown" />
          <FormControlLabel value='./assets/eyes/hazel.png' control={<Radio />} label="Hazel" />
          <FormControlLabel value='./assets/eyes/green.png' control={<Radio />} label="Green" />
          <FormControlLabel value='./assets/eyes/zombie.png' control={<Radio />} label="Zombie" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Hair Color</FormLabel>
        <RadioGroup aria-label="hair" name="haircolor" value={hairColor} onChange={(_, val) => {
            // @ts-ignore
            setHairColor(val);
          }}>
          <FormControlLabel value='bald' control={<Radio />} label="None" />
          <FormControlLabel value='gray' control={<Radio />} label="Gray" />
          <FormControlLabel value='brown' control={<Radio />} label="Brown" />
          <FormControlLabel value='blonde' control={<Radio />} label="Blonde" />
          <FormControlLabel value='red' control={<Radio />} label="Red" />
          <FormControlLabel value='black' control={<Radio />} label="Black" />
          <FormControlLabel value='pink' control={<Radio />} label="Pink" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Hair Length</FormLabel>
        <RadioGroup aria-label="hair length" name="hair length" value={hairLength} onChange={(_, val) => {
          // @ts-ignore
          setHairLength(val);
          }}>
          <FormControlLabel value='short' control={<Radio />} label="Short" />
          <FormControlLabel value='long' control={<Radio />} label="Long" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Mouth</FormLabel>
        <RadioGroup aria-label="mouth" name="skintone" value={mouth} onChange={(_, val) => setMouth(val)}>
          <FormControlLabel value='./assets/mouths/NormalLipstickMouth.png' control={<Radio />} label="Red/Bored" />
          <FormControlLabel value='./assets/mouths/stoic.png' control={<Radio />} label="Black/Bored" />
          <FormControlLabel value='./assets/mouths/SmirkLipstickMouth.png' control={<Radio />} label="Red/Smirk" />
          <FormControlLabel value='./assets/mouths/happy.png' control={<Radio />} label="Black/Smirk" />
          <FormControlLabel value='./assets/mouths/BoredLipstickMouth.png' control={<Radio />} label="Red/Mad" />
          <FormControlLabel value='./assets/mouths/mad.png' control={<Radio />} label="Black/Mad" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Jewelry</FormLabel>
        <RadioGroup aria-label="jewelry" name="jewelry" value={jewelry} onChange={(_, val) => setJewelry(val)}>
          <FormControlLabel value='./assets/hair/short/bald.png' control={<Radio />} label="None" />
          <FormControlLabel value='./assets/jewelry/diamond-stud.png' control={<Radio />} label="Diamond Stud" />
          <FormControlLabel value='./assets/jewelry/gold-stud.png' control={<Radio />} label="Gold Stud" />
          <FormControlLabel value='./assets/jewelry/gold-chain.png' control={<Radio />} label="Gold Chain" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Headband</FormLabel>
        <RadioGroup aria-label="headband" name="headband" value={sweatband} onChange={(_, val) => {
          // @ts-ignore
          setSweatband(val)
        }}>
          <FormControlLabel value='none' control={<Radio />} label="None" />
          <FormControlLabel value='Red' control={<Radio />} label="Red" />
          <FormControlLabel value='Blue' control={<Radio />} label="Blue" />
          <FormControlLabel value='Green' control={<Radio />} label="Green" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Accessories</FormLabel>
        <RadioGroup aria-label="jewelry" name="jewelry" value={accessory} onChange={(_, val) => setAccessory(val)}>
          <FormControlLabel value='./assets/hair/short/bald.png' control={<Radio />} label="None" />
          <FormControlLabel value='./assets/accessories/MedicalMask.png' control={<Radio />} label="COVID Mask" />
          <FormControlLabel value='./assets/accessories/Pipe.png' control={<Radio />} label="Pipe" />
        </RadioGroup>
      </FormControl>
      </div>
    </div>
  );
}

export default App;
