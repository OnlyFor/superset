/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
  CategoricalScheme,
  FeatureFlag,
  getCategoricalSchemeRegistry,
  getLabelsColorMap,
  LabelsColorMapSource,
} from '@superset-ui/core';

const actual = jest.requireActual('../../src/color/utils');
const getAnalogousColorsSpy = jest
  .spyOn(actual, 'getAnalogousColors')
  .mockImplementation(() => ['red', 'green', 'blue']);

describe('LabelsColorMap', () => {
  beforeAll(() => {
    getCategoricalSchemeRegistry()
      .registerValue(
        'testColors',
        new CategoricalScheme({
          id: 'testColors',
          colors: ['red', 'green', 'blue'],
        }),
      )
      .registerValue(
        'testColors2',
        new CategoricalScheme({
          id: 'testColors2',
          colors: ['yellow', 'green', 'blue'],
        }),
      );
  });

  beforeEach(() => {
    getLabelsColorMap().source = LabelsColorMapSource.Dashboard;
    getLabelsColorMap().clear();
  });

  it('has default value out-of-the-box', () => {
    expect(getLabelsColorMap()).toBeInstanceOf(LabelsColorMapSource);
  });

  describe('.addSlice(value, color, sliceId)', () => {
    it('should add to sliceLabelColorMap when first adding label', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      expect(labelsColorMap.sliceLabelMap.has(1)).toEqual(true);
      const labels = labelsColorMap.sliceLabelMap.get(1);
      expect(labels?.includes('a')).toEqual(true);
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({ a: 'red' });
    });

    it('should add to sliceLabelColorMap when slice exist', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 1);
      const labels = labelsColorMap.sliceLabelMap.get(1);
      expect(labels?.includes('b')).toEqual(true);
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({ a: 'red', b: 'blue' });
    });

    it('should use last color if adding label repeatedly', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('b', 'blue', 1);
      labelsColorMap.addSlice('b', 'green', 1);
      const labels = labelsColorMap.sliceLabelMap.get(1);
      expect(labels?.includes('b')).toEqual(true);
      expect(labels?.length).toEqual(1);
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({ b: 'green' });
    });

    it('should do nothing when source is not dashboard', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.source = LabelsColorMapSource.Explore;
      labelsColorMap.addSlice('a', 'red', 1);
      expect(Object.fromEntries(labelsColorMap.sliceLabelMap)).toEqual({});
    });
  });

  describe('.remove(sliceId)', () => {
    it('should remove sliceId', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.removeSlice(1);
      expect(labelsColorMap.sliceLabelMap.has(1)).toEqual(false);
    });

    it('should update colorMap', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 2);
      labelsColorMap.removeSlice(1);
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({ b: 'blue' });
    });

    it('should do nothing when source is not dashboard', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.source = LabelsColorMapSource.Explore;
      labelsColorMap.removeSlice(1);
      expect(labelsColorMap.sliceLabelMap.has(1)).toEqual(true);
    });
  });

  describe('.updateColorMap(namespace, scheme)', () => {
    it('should update color map', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'pink', 1);
      labelsColorMap.addSlice('b', 'green', 2);
      labelsColorMap.addSlice('c', 'blue', 2);
      labelsColorMap.updateColorMap('', 'testColors2');
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({
        a: 'yellow',
        b: 'green',
        c: 'yellow',
      });
    });

    it('should use recycle colors', () => {
      window.featureFlags = {
        [FeatureFlag.UseAnalagousColors]: false,
      };
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 2);
      labelsColorMap.addSlice('c', 'green', 3);
      labelsColorMap.addSlice('d', 'red', 4);
      labelsColorMap.updateColorMap('', 'testColors');
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).not.toEqual({});
      expect(getAnalogousColorsSpy).not.toBeCalled();
    });

    it('should use analagous colors', () => {
      window.featureFlags = {
        [FeatureFlag.UseAnalagousColors]: true,
      };
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 1);
      labelsColorMap.addSlice('c', 'green', 1);
      labelsColorMap.addSlice('d', 'red', 1);
      labelsColorMap.updateColorMap('', 'testColors');
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).not.toEqual({});
      expect(getAnalogousColorsSpy).toBeCalled();
    });
  });

  describe('.getColorMap()', () => {
    it('should get color map', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 2);
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({ a: 'red', b: 'blue' });
    });
  });

  describe('.reset()', () => {
    it('should reset color map', () => {
      const labelsColorMap = getLabelsColorMap();
      labelsColorMap.addSlice('a', 'red', 1);
      labelsColorMap.addSlice('b', 'blue', 2);
      labelsColorMap.clear();
      const colorMap = labelsColorMap.getColorMap();
      expect(Object.fromEntries(colorMap)).toEqual({});
    });
  });
});