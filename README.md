<!--links-->

[discord]: https://discord.com/invite/3VCndThqxS 'Discord Server'
[touchfree]: https://developer.leapmotion.com/touchfree 'TouchFree Download'
[web]: https://developer.leapmotion.com/touchfree-tooling-for-web 'TouchFree Web Tooling'
[unity]: https://developer.leapmotion.com/touchfree-tooling-unity 'TouchFree Unity Tooling'
[download]: https://developer.leapmotion.com/touchfree-tooling-for-web 'Ultraleap TouchFree Web Tooling Bundle Download'
[install]: https://www.npmjs.com/package/touchfree 'Ultraleap TouchFree Web Tooling'
[documentation]: https://docs.ultraleap.com/touchfree-user-manual/tooling-for-web.html 'Ultraleap TouchFree Web Tooling Documentation'
[setup]: https://docs.ultraleap.com/touchfree-user-manual/tooling-for-web.html#setup 'Ultraleap TouchFree Web Tooling Setup Documentation'
[examples]: https://github.com/ultraleap/TouchFree-Tooling-Examples/tree/develop/Examples-Web 'Ultraleap TouchFree Tooling Web Examples'

<!--content-->

# Ultraleap TouchFree Web Tooling

[![touchfree](https://img.shields.io/badge/TouchFree-00cf75)][touchfree]
[![webtooling](https://img.shields.io/badge/Web%20Tooling-00cf75)][web]
[![unitytooling](https://img.shields.io/badge/Unity%20Tooling-00cf75)][unity]
![GitHub](https://img.shields.io/github/license/ultraleap/TouchFreeWebTooling)

[![documentation](https://img.shields.io/badge/Documentation-docs.ultraleap.com-e47400)][documentation]
[![mail](https://img.shields.io/badge/Email%20Support%20-%20support%40ultraleap.com-7535de)](mailto:support@ultraleap.com)
[![discord](https://img.shields.io/badge/Ultraleap%20Developer%20Discord-7535de)][discord]

TouchFree Web Tooling empowers developers to build touchless Web applications using Ultraleap's hand tracking technology.

## Getting Started

Install from [NPM][install]:

```
npm i touchfree
```

Follow the [setup steps here][setup] to get started with TouchFree Web Tooling.

> NPM is the recommended way to consume this package. However, if you can't use NPM, we also offer a JavaScript bundle which can be found [here][download].

## Examples

The tooling bundle includes a quick start example: `quick-start/Quick-Start_Example.html`.

More examples can be found in [TouchFree Tooling Web Examples][examples].

## Developer Guide

### Setup

In order to work on TouchFree Tooling for web, you will need to do the following:

- Install the LTS of [Node.js](https://nodejs.org/en/download/)
- Open this directory in a terminal and run `npm i` to install dependencies
  - _Note: An IDE with an integrated terminal such as Visual Studio Code is recommended._
- To build TouchFree and the Snapping Plugin for Web, run `npm run build` in this directory once the dependencies are installed as above
- To run the unit tests, run `npm test` in this directory

# Support

User Support Email: support@ultraleap.com

[Ultraleap Developer Discord][discord]
