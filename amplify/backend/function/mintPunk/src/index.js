const {ethers} = require('ethers');
const MerkleTreeProof = require('@authenticid-labs/merkle-tree-proof');
const { MerkleTree } = require('merkletreejs');
const axios = require('axios').default;

const main = async(args) => {
    const {address, proofs, selfie} = args;
    try {
        const provider = new ethers.providers.AlchemyProvider('rinkeby', process.env.ALCHEMY_ID);

        console.log('Address: ', address);
        const root = await MerkleTreeProof.getMerkleTreeRoot(provider, address);
        if (root === '0x0') {
            // this really should not happen as a non-Real ID user cannot mint
            throw new Error('No Merkle Root');
        }
        const fixedProofs = proofs.map(p => {
            const {position, leaf, data} = p;
            return {position, leaf, data: Buffer.from(data)}
        });
        const proven = fixedProofs.every(({leaf, ...proof}) => MerkleTree.verify(proof, leaf, root));
        if (fixedProofs.length > 0 && proven) {
            console.log('proofs proven')
        } else {
            console.log('no proofs proven')
        }
    } catch (error) {
        console.log(error);
    }

    try{
        if (!!selfie) {
            const {data: faceAnalysis} = await axios.post('https://api.authenticid.solutions/face/metadata', {
                attributes: ['Gender', 'GeographicOrigin', 'Emotion', 'Glasses', 'FacialHair', 'Artwork'],
                image: selfie
              });
                const {
                Emotion,
                FacialHair,
                Gender,
                GeographicOrigin,
                Glasses,
                Artwork
            } = faceAnalysis.attributes;
            console.log(faceAnalysis);
            return {result: faceAnalysis};
        }
    } catch (error) {
        console.log(error);
    }
    return {result: 'complete'};
}

exports.handler = async (event) => {
    const args = JSON.parse(event.body);
    const result = await main(args);

    const response = {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
     headers: {
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "*"
     }, 
        body: JSON.stringify(result),
    };
    return response;
};
