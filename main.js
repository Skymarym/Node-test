function customStringify(value, replacer, space) {
  const stack = new Set();
  const gap = typeof space === 'number' ? ' '.repeat(Math.min(space, 10)) :
              typeof space === 'string' ? space.slice(0, 10) : '';
  let indent = '';
  const isReplacerArray = Array.isArray(replacer);
  const replacerFunc = typeof replacer === 'function' ? replacer : null;

  function serialize(key, value) {
      // Применение функции замены
      if (replacerFunc) {
          value = replacerFunc.call(this, key, value);
      } else if (isReplacerArray && key !== '' && !replacer.includes(key)) {
          return undefined; // Пропускаем ключи, не включенные в массив замен
      }

      // Обработка различных типов значений
      if (value === null) return 'null';
      if (typeof value === 'boolean' || typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null';
      }
      if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
      if (typeof value === 'symbol' || typeof value === 'function' || typeof value === 'undefined') {
          return undefined;
      }

      // Обработка объектов
      if (typeof value === 'object') {
          if (stack.has(value)) {
              throw new TypeError('Converting circular structure to JSON');
          }
          stack.add(value);

          let result;
          if (Array.isArray(value)) {
              result = serializeArray(value);
          } else if (value instanceof Date) {
              result = isNaN(value.getTime()) ? 'null' : `"${value.toISOString()}"`;
          } else {
              result = serializeObject(value);
          }
          stack.delete(value);
          return result;
      }
  }

  function serializeArray(arr) {
      const serializedItems = arr.map((item, index) => {
          const serializedItem = serialize(index, item);
          return serializedItem !== undefined ? serializedItem : 'null';
      });
      return gap ? `[\n${indent + gap}${serializedItems.join(`,\n${indent + gap}`)}\n${indent}]` : `[${serializedItems.join(',')}]`;
  }

  function serializeObject(obj) {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';

      indent += gap; // Увеличиваем отступ
      const serializedEntries = keys.map(key => {
          const serializedValue = serialize(key, obj[key]);
          return serializedValue !== undefined ? `"${key}":${gap ? ' ' : ''}${serializedValue}` : undefined;
      }).filter(entry => entry !== undefined);

      indent = indent.slice(0, -gap.length); // Уменьшаем отступ
      return gap ? `{\n${indent + gap}${serializedEntries.join(`,\n${indent + gap}`)}\n${indent}}` : `{${serializedEntries.join(',')}}`;
  }

  // Запуск сериализации с пустым ключом
  const jsonString = serialize('', value);
  return jsonString !== undefined ? jsonString : undefined;
}

function runTests() {
  const testCases = [
      {
          description: "Basic object",
          value: { name: "Alice", age: 25, active: true },
          replacer: null,
          space: null
      },
      {
          description: "Nested object",
          value: { user: { name: "Alice", address: { city: "Wonderland" } } },
          replacer: null,
          space: 2
      },
      {
          description: "Array with various types",
          value: [1, "text", true, null, undefined, { nested: "object" }],
          replacer: null,
          space: null
      },
      {
          description: "Date object",
          value: { today: new Date("2022-09-12T10:00:00Z") },
          replacer: null,
          space: null
      },
      {
          description: "Handling of NaN and Infinity",
          value: { num: NaN, inf: Infinity, ninf: -Infinity },
          replacer: null,
          space: null
      },
      {
          description: "Cyclic reference",
          value: (() => {
              const obj = {};
              obj.self = obj;
              return obj;
          })(),
          replacer: null,
          space: null,
          expectError: true
      },
      {
          description: "Replacer function (omit numbers)",
          value: { name: "Alice", age: 25 },
          replacer: (key, value) => (typeof value === "number" ? undefined : value),
          space: null
      },
      {
          description: "Replacer array (include only certain keys)",
          value: { name: "Alice", age: 25, city: "Wonderland" },
          replacer: ["name", "city"],
          space: null
      },
      {
          description: "Formatted JSON with space",
          value: { user: { name: "Alice", hobbies: ["reading", "chess"] } },
          replacer: null,
          space: 4
      },
      {
          description: "String with special characters",
          value: { quote: "She said, \"Hello, world!\"" },
          replacer: null,
          space: null
      },
      {
          description: "Symbol and function handling",
          value: { sym: Symbol("id"), func: () => "test" },
          replacer: null,
          space: null
      },
      {
          description: "Replacer function (capitalize strings)",
          value: { name: "alice", city: "wonderland" },
          replacer: (key, value) => (typeof value === "string" ? value.toUpperCase() : value),
          space: null
      },
      {
          description: "Formatted JSON with two-space indentation",
          value: { user: { name: "Alice", age: 25, hobbies: ["reading", "chess"] } },
          replacer: null,
          space: 2
      },
      {
          description: "Replacer function (remove specific properties)",
          value: { name: "Alice", age: 25, password: "secret" },
          replacer: (key, value) => (key === "password" ? undefined : value),
          space: null
      }
  ];

  testCases.forEach(({ description, value, replacer, space, expectError }, index) => {
      try {
          const customResult = customStringify(value, replacer, space);
          const jsonResult = JSON.stringify(value, replacer, space);

          if (expectError) {
              console.log(`Test ${index + 1} - ${description}: ❌ Failed (Expected an error but got result)`);
          } else if (customResult === jsonResult) {
              console.log(`Test ${index + 1} - ${description}: ✅ Passed`);
          } else {
              console.log(`Test ${index + 1} - ${description}: ❌ Failed`);
          }
      } catch (error) {
          if (expectError) {
              console.log(`Test ${index + 1} - ${description}: ✅ Passed (Expected error)`);
          } else {
              console.log(`Test ${index + 1} - ${description}: ❌ Failed with error - ${error.message}`);
          }
      }
  });
}

// Запуск тестов
runTests();
