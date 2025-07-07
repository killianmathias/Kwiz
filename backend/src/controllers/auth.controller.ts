// const express = require("express");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

import { Express, Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, username } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hash,
        username: username,
        profilePicture: "image",
        numberOfGames: 0,
      },
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(401).json({ error });
  }
};
export const logIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      res
        .status(401)
        .json({ message: "La paire identifiant/mot de passe n'existe pas !" });
    } else {
      const valid = bcrypt.compare(password, user.password);
      const id = user.id;
      if (!valid) {
        res.status(401).json({
          message: "La paire identifiant/mot de passe n'existe pas !",
        });
      } else {
        res.status(200).json({
          userId: id,
          token: jwt.sign({ userId: id }, "RANDOM_TOKEN_SECRET", {
            expiresIn: "24h",
          }),
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error });
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ Erreur: "Utilisateur introuvable" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(400).json({ Erreur: "Utilisateur introuvable" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
};
