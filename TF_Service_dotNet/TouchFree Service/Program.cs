﻿using System;
using Ultraleap.TouchFree.Library.Configuration;

namespace Ultraleap.TouchFree.Service
{
    class Program
    {

        static void Main(string[] args)
        {
            UpdateBehaviour updateLoop = new();
            updateLoop.OnUpdate += TickTock;

            ConfigFileWatcher configFileWatcher = new ConfigFileWatcher();
            updateLoop.OnUpdate += configFileWatcher.Update;

            Console.WriteLine("TouchFree physical config screen height is: " + ConfigManager.PhysicalConfig.ScreenHeightM);
            while(true)
            {

            }
        }

        private static void TickTock()
        {
            //Console.WriteLine("TickTock");
        }
    }
}