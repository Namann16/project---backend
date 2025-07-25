import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: [],
    });

    res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos");

    res.status(200).json(new ApiResponse(200, playlists, "User playlists fetched"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    res.status(200).json(new ApiResponse(200, playlist, "Playlist details fetched"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    if (!playlist.videos.includes(videoId)) {
        playlist.videos.push(videoId);
        await playlist.save();
    }

    res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to modify this playlist");
    }

    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);
    await playlist.save();

    res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to delete this playlist");
    }

    await playlist.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "Playlist deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) throw new ApiError(404, "Playlist not found");

    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "Unauthorized to update this playlist");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save();

    res.status(200).json(new ApiResponse(200, playlist, "Playlist updated"));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
