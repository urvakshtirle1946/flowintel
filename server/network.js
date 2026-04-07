const zones = [
  {
    id: 'zone-super-corridor',
    name: 'Indore City Central Grid',
    areaLabel: 'Indore East Service Area',
    description:
      'Primary residential and commercial distribution network routing through dense urban alleyways.',
    center: [22.6963268, 75.9316839],
    tank: {
      id: 'tank-super-corridor',
      label: 'Main City Reservoir',
      position: [22.6978, 75.9288],
      capacityLpm: 3200,
    },
    houses: [
      {
        id: 'house_1',
        name: 'Scheme 114 Homes',
        label: 'Residential Cluster A',
        position: [22.6989, 75.9346],
        demandBand: 'Standard',
      },
      {
        id: 'house_2',
        name: 'Tulsi Nagar Block',
        label: 'Residential Cluster B',
        position: [22.6947, 75.9363],
        demandBand: 'High',
      },
      {
        id: 'house_3',
        name: 'Service Quarters East',
        label: 'Administration Offices',
        position: [22.6935, 75.9304],
        demandBand: 'Standard',
      },
      {
        id: 'house_4',
        name: 'Ring Road Villas',
        label: 'Residential Estate',
        position: [22.7025, 75.9402],
        demandBand: 'Standard',
      },
      {
        id: 'house_5',
        name: 'Community Health Centre',
        label: 'Priority Supply Node',
        position: [22.6992, 75.9416],
        demandBand: 'Critical',
      },
      {
        id: 'house_6',
        name: 'Apartment Cluster North',
        label: 'High-Density Residential',
        position: [22.6974, 75.9386],
        demandBand: 'High',
      },
      {
        id: 'house_7',
        name: 'Palasia Market',
        label: 'Commercial Hub',
        position: [22.7015, 75.9250],
        demandBand: 'High',
      },
      {
        id: 'house_8',
        name: 'Bhawarkuan Junction',
        label: 'Transport Node',
        position: [22.6920, 75.9250],
        demandBand: 'Critical',
      }
    ],
    pipelines: [
      {
        id: 'pipe_1',
        label: 'Alleyway Line P-01',
        houseId: 'house_1',
        points: [
          [22.6978, 75.9288],
          [22.6978, 75.9300],
          [22.6983, 75.9300],
          [22.6983, 75.9315],
          [22.6989, 75.9315],
          [22.6989, 75.9346],
        ],
      },
      {
        id: 'pipe_2',
        label: 'Alleyway Line P-02',
        houseId: 'house_2',
        points: [
          [22.6978, 75.9288],
          [22.6965, 75.9288],
          [22.6965, 75.9320],
          [22.6955, 75.9320],
          [22.6955, 75.9363],
          [22.6947, 75.9363],
        ],
      },
      {
        id: 'pipe_3',
        label: 'Alleyway Line P-03',
        houseId: 'house_3',
        points: [
          [22.6978, 75.9288],
          [22.6978, 75.9270],
          [22.6950, 75.9270],
          [22.6950, 75.9290],
          [22.6935, 75.9290],
          [22.6935, 75.9304],
        ],
      },
      {
        id: 'pipe_4',
        label: 'Alleyway Line P-04',
        houseId: 'house_4',
        points: [
          [22.6978, 75.9288],
          [22.6995, 75.9288],
          [22.6995, 75.9330],
          [22.7010, 75.9330],
          [22.7010, 75.9402],
          [22.7025, 75.9402],
        ],
      },
      {
        id: 'pipe_5',
        label: 'Alleyway Line P-05',
        houseId: 'house_5',
        points: [
          [22.6978, 75.9288],
          [22.6978, 75.9350],
          [22.6985, 75.9350],
          [22.6985, 75.9416],
          [22.6992, 75.9416],
        ],
      },
      {
        id: 'pipe_6',
        label: 'Alleyway Line P-06',
        houseId: 'house_6',
        points: [
          [22.6978, 75.9288],
          [22.6974, 75.9288],
          [22.6974, 75.9350],
          [22.6970, 75.9350],
          [22.6970, 75.9386],
          [22.6974, 75.9386],
        ],
      },
      {
        id: 'pipe_7',
        label: 'Alleyway Line P-07',
        houseId: 'house_7',
        points: [
          [22.6978, 75.9288],
          [22.6978, 75.9250],
          [22.6990, 75.9250],
          [22.6990, 75.9265],
          [22.7015, 75.9265],
          [22.7015, 75.9250],
        ],
      },
      {
        id: 'pipe_8',
        label: 'Alleyway Line P-08',
        houseId: 'house_8',
        points: [
          [22.6978, 75.9288],
          [22.6978, 75.9260],
          [22.6940, 75.9260],
          [22.6940, 75.9250],
          [22.6920, 75.9250],
        ],
      }
    ],
  },
];

const houses = zones.flatMap((zone) =>
  zone.houses.map((house) => {
    const pipeline = zone.pipelines.find((item) => item.houseId === house.id);

    return {
      ...house,
      zoneId: zone.id,
      zoneName: zone.name,
      pipelineId: pipeline?.id,
      pipelineLabel: pipeline?.label,
      tankId: zone.tank.id,
    };
  }),
);

const houseMap = new Map(houses.map((house) => [house.id, house]));

const getNetworkSnapshot = () => ({
  generatedAt: new Date().toISOString(),
  zones,
});

const getHouseById = (houseId) => houseMap.get(houseId);

module.exports = {
  zones,
  houses,
  getNetworkSnapshot,
  getHouseById,
};
