const chai = require('chai');
const expect = chai.expect;
const assertion = chai.assertion;
const fs = require('fs');

const sdk = require('../../index');
const common = require('../../sdk/util/common');
const Account = sdk.Account;
const Asset = sdk.Asset;
const CONSTANTS = require('../constant/constants');

let testData = {
    testnet: {
        seed: '9J87CAsHdFdoEu6N1unZk3sqhVBkVL8Z8',
        phrase: 'name gaze apart lamp lift zone believe steak session laptop crowd hill',
        accountNumber: 'eMCcmw1SKoohNUf3LeioTFKaYNYfp2bzFYpjm3EddwxBSWYVCb',
        publicKey: '369f6ceb1c23dbccc61b75e7990d0b2db8e1ee8da1c44db32280e63ca5804f38',
        network: 'testnet',
        existedAssetIds: ['c54294134a632c478e978bcd7088e368828474a0d3716b884dd16c2a397edff357e76f90163061934f2c2acba1a77a5dcf6833beca000992e63e19dfaa5aee2a', 'd5d99e063eff28188f8fe9f5cf5f357490a6a0aaff169def257d12ee148a26a89de115e856e6ae934ce680c2127ec42d4e3c7598ef9c4f7a9170c5dfb0116bcf']
    }
};

describe('Asset', function () {
    before(function () {
        sdk.init({network: 'testnet', apiToken: CONSTANTS.TEST_API_TOKEN});
    });

    describe('Register Asset', function () {
        this.timeout(15000);

        it('should register new asset', async function () {
            let account = Account.fromSeed(testData.testnet.seed);
            let testFile = './test/tmp/myfile.test';
            fs.writeFileSync(testFile, common.generateRandomBytesByLength(1000));

            let registrationParams = Asset.newRegistrationParams('name', {});
            await registrationParams.setFingerprint(testFile);
            registrationParams.sign(account);

            let response = (await Asset.register(registrationParams)).assets;
            fs.unlinkSync(testFile);

            expect(response).to.be.an('array');
            expect(response[0]).to.have.property('id');
            expect(response[0].duplicate).to.be.equal(false);
        });

        it('should register existing asset', async function () {
            let account = Account.fromSeed(testData.testnet.seed);
            let testFile = './test/tmp/undelete.test';

            let registrationParams = Asset.newRegistrationParams('name', {author: 'test'});
            await registrationParams.setFingerprint(testFile);
            registrationParams.sign(account);

            let response = (await Asset.register(registrationParams)).assets;
            expect(response).to.be.an('array');
            expect(response[0]).to.have.property('id');
            expect(response[0].duplicate).to.be.equal(true);
        });

        it('should not re-register existing asset with different asset name', async function () {
            let account = Account.fromSeed(testData.testnet.seed);
            let testFile = './test/tmp/undelete.test';

            let registrationParams = Asset.newRegistrationParams('another name', {author: 'test'});
            await registrationParams.setFingerprint(testFile);
            registrationParams.sign(account);

            try {
                await Asset.register(registrationParams);
                assertion.fail();
            } catch (error) {
                expect(error.response.status).to.be.equal(403);
            }
        });

        it('should not re-register existing asset with different metadata name', async function () {
            let account = Account.fromSeed(testData.testnet.seed);
            let testFile = './test/tmp/undelete.test';

            let registrationParams = Asset.newRegistrationParams('name', {author: 'test', new_attribute: 'new_attribute'});
            await registrationParams.setFingerprint(testFile);
            registrationParams.sign(account);

            try {
                await Asset.register(registrationParams);
                assertion.fail();
            } catch (error) {
                expect(error.response.status).to.be.equal(403);
            }
        });
    });

    describe('Query Asset', function () {
        this.timeout(15000);

        describe('Query assets - List', function () {
            it('should get assets by registrant', async function () {
                let assetQueryParams = Asset.newAssetQueryBuilder().registeredBy(testData.testnet.accountNumber).build();
                let response = await Asset.list(assetQueryParams);
                let assets = response.assets;

                expect(assets).to.be.an('array');
                assets.forEach((tx) => {
                    expect(tx.registrant).to.be.equal(testData.testnet.accountNumber);
                });
            });

            it('should get assets with limit', async function () {
                let limit = 1;
                let assetQueryParams = Asset.newAssetQueryBuilder().limit(limit).build();
                let response = await Asset.list(assetQueryParams);
                expect(response.assets).to.be.an('array');
                expect(response.assets.length).to.be.equal(limit);
            });

            it('should get assets by asset ids', async function () {
                let assetIds = testData.testnet.existedAssetIds;
                let assetQueryParams = Asset.newAssetQueryBuilder().assetIds(assetIds).pending(true).build();
                let response = await Asset.list(assetQueryParams);
                let assets = response.assets;
                expect(assets).to.be.an('array');
                expect(assets.length).to.be.equal(assetIds.length);
                assets.forEach((asset) => {
                    expect(assetIds.includes(asset.id)).to.be.equal(true);
                });
            });
        });

        describe('Query asset - Get', function () {
            it('should get asset by id', async function () {
                let limit = 1;
                let assetQueryParams = Asset.newAssetQueryBuilder().limit(limit).build();
                let assetsResponse = await Asset.list(assetQueryParams);
                expect(assetsResponse.assets).to.be.an('array');
                expect(assetsResponse.assets.length).to.be.equal(limit);

                let assetId = assetsResponse.assets[0].id;
                let assetResponse = await Asset.get(assetId);
                expect(assetResponse).to.have.property('asset');
                expect(assetResponse.asset).to.have.property('id');
                expect(assetResponse.asset.id).to.be.equal(assetId);
            });
        });
    });
});